import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// BUG-90: the browser sends a CORS preflight (OPTIONS) before the real POST.
// Without these headers and an explicit OPTIONS branch, the preflight itself
// throws inside the handler (await req.json() on an empty body) and returns
// a 500 with no CORS headers, so the browser blocks the real POST before it's
// ever sent. That is why every report was stuck at status='submitted' forever
// with notion_page_url=null, tandem.html's fire-and-forget .catch(() => {})
// silently ate the resulting network error.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let supabase: ReturnType<typeof createClient> | null = null
  let report_id: string | undefined

  try {
    ({ report_id } = await req.json())

    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Step 1: Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('user_bug_reports')
      .select('*')
      .eq('id', report_id)
      .single()

    if (reportError || !report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers: corsHeaders })
    }

    // Resolve reporter name from known UUIDs
    const isDani = report.user_id === '3a6e34b7-d197-47b4-bedb-de49bbe552fb'
    const isKerwin = report.user_id === 'e636007d-194f-4440-a2cc-9bc514957c64'
    const reportedByLabel = isDani ? 'Dani' : isKerwin ? 'Kerwin' : 'Unknown'
    const notionReportedBy = isDani ? 'Dani' : 'Kerwin'

    // Step 2: Expand with Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        system: `You are a QA engineer for Tandem, a couples fitness competition web app. Expand the user bug report into a structured report. Output EXACTLY in this format with each label on its own line:\n\nSUMMARY: [one sentence]\nSTEPS_TO_REPRODUCE: [numbered steps inferred from description]\nEXPECTED_BEHAVIOR: [what should have happened]\nACTUAL_BEHAVIOR: [what actually happened]\nSEVERITY: [one of exactly: P0 Blocks Workout / P1 Wrong Data / P2 Visual UX]\nERROR_MESSAGE: [any error message mentioned, or None reported]\n\nKeep it under 300 words total. Be specific and actionable.`,
        messages: [{
          role: 'user',
          content: `Reported by: ${reportedByLabel}\nDescription: "${report.description}"\nScreenshot attached: ${report.screenshot_url ? 'Yes' : 'No'}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    if (!claudeRes.ok) {
      throw new Error(`Claude API ${claudeRes.status}: ${JSON.stringify(claudeData).slice(0, 500)}`)
    }
    const expanded: string = claudeData.content?.[0]?.text ?? report.description

    // Parse structured fields from Claude output
    const extract = (label: string): string => {
      const match = expanded.match(new RegExp(`${label}:\\s*([\\s\\S]+?)(?=\\n[A-Z_]+:|$)`))
      return match ? match[1].trim() : ''
    }

    const summary = extract('SUMMARY') || report.description.slice(0, 100)
    const steps = extract('STEPS_TO_REPRODUCE')
    const expected = extract('EXPECTED_BEHAVIOR')
    const actual = extract('ACTUAL_BEHAVIOR')
    const severityRaw = extract('SEVERITY').toLowerCase()
    const errorMsg = extract('ERROR_MESSAGE')

    const severityMap: Record<string, string> = {
      'p0': 'P0 Blocks Workout',
      'p1': 'P1 Wrong Data',
      'p2': 'P2 Visual UX'
    }
    const severityKey = Object.keys(severityMap).find(k => severityRaw.startsWith(k))
    const severity = severityKey ? severityMap[severityKey] : 'P2 Visual UX'

    // Step 3: Create Notion page in Bug & QA Log
    const notionProperties: Record<string, unknown> = {
      'Bug Title': { title: [{ text: { content: summary } }] },
      'Status': { select: { name: 'New' } },
      'Reported By': { select: { name: notionReportedBy } },
      'Severity': { select: { name: severity } }
    }

    if (steps) notionProperties['Steps to Reproduce'] = { rich_text: [{ text: { content: steps } }] }
    if (expected) notionProperties['Expected Behavior'] = { rich_text: [{ text: { content: expected } }] }
    if (actual) notionProperties['Actual Behavior'] = { rich_text: [{ text: { content: actual } }] }
    if (errorMsg && errorMsg.toLowerCase() !== 'none reported') {
      notionProperties['Error Message'] = { rich_text: [{ text: { content: errorMsg } }] }
    }

    const notionChildren: unknown[] = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: expanded } }] }
      }
    ]

    if (report.screenshot_url) {
      notionChildren.push({
        object: 'block',
        type: 'image',
        image: { type: 'external', external: { url: report.screenshot_url } }
      })
    }

    // caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0 is the Bug & QA Log's DATA SOURCE id
    // (collection://...), not the database page's own id (56397626-...). The
    // old 2022-06-28 API's `database_id` parent predates Notion's data-source
    // model and doesn't resolve a data-source id — every call 404'd with
    // "Could not find database", which reads exactly like a sharing/permission
    // problem but never was one. Bumped to the data-source-aware API version
    // and parent type so the id we actually have matches what we send.
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('NOTION_TOKEN')}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2025-09-03'
      },
      body: JSON.stringify({
        parent: { data_source_id: 'caaf2179-c4e4-4ce1-9a32-eb46ffdbd6a0' },
        properties: notionProperties,
        children: notionChildren
      })
    })

    const notionData = await notionRes.json()
    if (!notionRes.ok) {
      throw new Error(`Notion API ${notionRes.status}: ${JSON.stringify(notionData).slice(0, 500)}`)
    }
    const notionUrl: string | null = notionData.url ?? null

    // Step 4: Update user_bug_reports with expanded data
    await supabase
      .from('user_bug_reports')
      .update({
        expanded_description: expanded,
        notion_page_url: notionUrl,
        status: 'logged_to_notion'
      })
      .eq('id', report_id)

    return new Response(
      JSON.stringify({ ok: true, notion_url: notionUrl, severity }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    // Previously a failure here (bad token, API error, etc.) left the row
    // looking untouched at status='submitted' forever — indistinguishable
    // from "never ran." Mark it failed with the reason so it's visible in
    // the QA feed instead of silently unmeasurable (the actual BUG-90 defect,
    // not just its CORS trigger).
    if (supabase && report_id) {
      await supabase
        .from('user_bug_reports')
        .update({
          status: 'sync_failed',
          expanded_description: `[sync error] ${String(err).slice(0, 500)}`
        })
        .eq('id', report_id)
        .then(() => {}, () => {})
    }
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
