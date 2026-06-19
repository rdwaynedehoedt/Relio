# Google Cloud API Setup — Relio

This is a ONE-TIME setup per Google Cloud project.
If you ever create a new Firebase/Google Cloud project for Relio, redo this checklist.

## Current project: 828122186689

## APIs that must be enabled

### 1. People API (Google Contacts import)

What it does: Lets Relio read your Google Contacts

Enable here:

https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=828122186689

Click the blue "Enable" button.
Wait 1-2 minutes for it to propagate.

How to verify it's working:

Go to Relio → Settings → Integrations → click "Test connection" next to Google Contacts.

### 2. Google Calendar API (Calendar sync)

What it does: Lets Relio read and create calendar events

Enable here:

https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=828122186689

Click the blue "Enable" button.
Wait 1-2 minutes for it to propagate.

How to verify it's working:

Go to Relio → Settings → Integrations → click "Test connection" next to Google Calendar.

## If you add new Google integrations later

Any NEW Google API (Drive, Gmail, Sheets, etc.) requires this same two-step process:

1. Add the OAuth scope in `src/lib/firebase.ts`
2. Enable the matching API in Cloud Console using the same pattern:

   `https://console.cloud.google.com/apis/library/[API_NAME]?project=828122186689`

## Quick reference — common Google APIs

| API | Enable URL pattern |
|-----|-------------------|
| People API | `people.googleapis.com` |
| Calendar API | `calendar-json.googleapis.com` |
| Gmail API | `gmail.googleapis.com` |
| Drive API | `drive.googleapis.com` |
| Sheets API | `sheets.googleapis.com` |

Replace `[API_NAME]` in:

`https://console.cloud.google.com/apis/library/[API_NAME]?project=828122186689`
