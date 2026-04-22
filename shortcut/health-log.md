# Tandem Health Log — Apple Shortcut

Logs today's Apple Health data to Supabase `health_snapshots` so the Tandem dashboard populates.

Run this Shortcut once daily (or set an automation to trigger at midnight/morning).

---

## Supabase Config

| Field | Value |
|---|---|
| Project URL | `https://zsvktcvqmppsshtpeljt.supabase.co` |
| Anon Key | `sb_publishable_8gQMcE88UKwBqR9fIv0OuQ_8Xn3PGJ7` |
| Endpoint | `https://zsvktcvqmppsshtpeljt.supabase.co/rest/v1/health_snapshots` |

---

## Apple Health Identifiers to Query

| Shortcut display name | HK Identifier | Supabase column | Unit |
|---|---|---|---|
| Active Energy | `HKQuantityTypeIdentifierActiveEnergyBurned` | `active_calories_kcal` | kcal |
| Sleep (total) | `HKCategoryTypeIdentifierSleepAnalysis` | `sleep_total_hours` | hours |
| Steps | `HKQuantityTypeIdentifierStepCount` | `steps` | count |
| Dietary Energy | `HKQuantityTypeIdentifierDietaryEnergyConsumed` | `dietary_calories_kcal` | kcal |
| Protein | `HKQuantityTypeIdentifierDietaryProtein` | `dietary_protein_g` | g |
| Carbohydrates | `HKQuantityTypeIdentifierDietaryCarbohydrates` | `dietary_carbs_g` | g |
| Fat (Total) | `HKQuantityTypeIdentifierDietaryFatTotal` | `dietary_fat_g` | g |

---

## Shortcut Steps (build in the Shortcuts app)

### 1. Set date variables
- **Action:** Date → "Today"
- **Action:** Format Date → format `yyyy-MM-dd` → save as `today_str`
- **Action:** Date (start of day) → save as `day_start`

### 2. Query each Health type
For each identifier, add a **"Find Health Samples"** action:

```
Find Health Samples where:
  Type = <identifier>
  Start date is after: day_start
  End date is before: now
  Sort by: Start Date, Newest First
  Limit: all
```

After each query, add **"Calculate Statistics"** on the result → **Sum** → save as the variable name below:

| Variable name | Type |
|---|---|
| `active_cal` | Active Energy |
| `sleep_hrs` | Sleep (use duration sum ÷ 3600 via Calculate) |
| `steps_count` | Steps |
| `diet_cal` | Dietary Energy |
| `protein_g` | Protein |
| `carbs_g` | Carbohydrates |
| `fat_g` | Fat (Total) |

> **Sleep note:** Sleep samples return duration in seconds. Add a **Calculate** action: `sleep_hrs = sleep_duration_sum / 3600`

### 3. Get current user JWT
- **Action:** Get Contents of URL
  - URL: `https://zsvktcvqmppsshtpeljt.supabase.co/auth/v1/token?grant_type=password`
  - Method: POST (or store your JWT as a text variable manually — see below)

> **Easier auth option:** After signing into Tandem on your phone, copy your JWT from Settings → the app stores it in localStorage as `sb-zsvktcvqmppsshtpeljt-auth-token`. Paste it as a **Text** variable `user_jwt` in the Shortcut. Refresh it whenever you re-authenticate.

### 4. POST to Supabase

- **Action:** Get Contents of URL
  - URL: `https://zsvktcvqmppsshtpeljt.supabase.co/rest/v1/health_snapshots`
  - Method: **POST**
  - Headers:
    ```
    apikey: sb_publishable_8gQMcE88UKwBqR9fIv0OuQ_8Xn3PGJ7
    Authorization: Bearer <user_jwt>
    Content-Type: application/json
    Prefer: resolution=merge-duplicates
    ```
  - Body (JSON):
    ```json
    {
      "user_id": "<your_user_id_uuid>",
      "snapshot_date": "<today_str>",
      "active_calories_kcal": <active_cal>,
      "sleep_total_hours": <sleep_hrs>,
      "steps": <steps_count>,
      "dietary_calories_kcal": <diet_cal>,
      "dietary_protein_g": <protein_g>,
      "dietary_carbs_g": <carbs_g>,
      "dietary_fat_g": <fat_g>
    }
    ```

> The `Prefer: resolution=merge-duplicates` header means running the Shortcut twice on the same day updates the existing row instead of inserting a duplicate.

### 5. Confirm
- **Action:** Show notification → "Tandem health data logged ✓"

---

## User IDs
| User | UUID |
|---|---|
| Kerwin | `e636007d-194f-4440-a2cc-9bc514957c64` |
| Dani | `3a6e34b7-d197-47b4-bedb-de49bbe552fb` |
