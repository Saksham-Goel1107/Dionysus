# Announcement Bell Configuration

The announcement bell system is controlled by two ConfigCat feature flags:

## ConfigCat Feature Flags

### 1. `announcements-enabled` (Boolean)

- **Type**: Boolean
- **Purpose**: Enable/disable the entire announcement system
- **Default**: `false`
- **Usage**: Set to `true` to show the bell icon, `false` to hide it completely

### 2. `announcements-config` (String)

- **Type**: String (JSON)
- **Purpose**: Configure the announcements content
- **Default**: Empty string (will use hardcoded defaults)
- **Format**: JSON array of announcement objects

## Announcement JSON Format

Each announcement should have the following structure:

```json
[
  {
    "id": "unique-announcement-id",
    "title": "Announcement Title",
    "message": "Detailed message for the announcement",
    "type": "info|success|warning|error",
    "timestamp": "2025-08-31T12:00:00Z",
    "isNew": true
  }
]
```

### Field Descriptions

- **id**: Unique identifier for the announcement (used for read tracking)
- **title**: Short, descriptive title with optional emoji
- **message**: Detailed message explaining the announcement
- **type**: Visual styling type:
  - `info` - Blue styling with info icon
  - `success` - Green styling with checkmark icon
  - `warning` - Yellow styling with warning triangle
  - `error` - Red styling with alert circle
- **timestamp**: ISO 8601 timestamp for when the announcement was created
- **isNew**: Boolean indicating if this is a new announcement (affects styling)

## Example ConfigCat Configuration

### Enable Announcements

Set `announcements-enabled` to `true`

### Multiple Announcements Example

Set `announcements-config` to:

```json
[
  {
    "id": "feature-release-v2",
    "title": "🚀 Major Update Released!",
    "message": "We've launched version 2.0 with enhanced AI capabilities, improved performance, and a redesigned dashboard. Check out the new features in your settings panel!",
    "type": "success",
    "timestamp": "2025-08-31T14:30:00Z",
    "isNew": true
  },
  {
    "id": "maintenance-sep-5",
    "title": "⚠️ Scheduled Maintenance",
    "message": "We'll be performing server maintenance on September 5th from 2:00 AM to 4:00 AM UTC. The platform will be temporarily unavailable during this time.",
    "type": "warning",
    "timestamp": "2025-08-30T10:00:00Z",
    "isNew": true
  },
  {
    "id": "new-integrations",
    "title": "🔗 New Integrations Available",
    "message": "We've added support for Slack notifications, Discord webhooks, and Microsoft Teams integration. Set them up in your project settings.",
    "type": "info",
    "timestamp": "2025-08-29T16:45:00Z",
    "isNew": false
  }
]
```

## How It Works

1. **Feature Toggle**: The `announcements-enabled` flag controls whether the bell icon appears
2. **Content Management**: The `announcements-config` flag contains the JSON configuration
3. **Fallback**: If the JSON is invalid or empty, default hardcoded announcements are used
4. **Read Tracking**: User's read status is stored in localStorage using announcement IDs
5. **Real-time Updates**: Changes to ConfigCat flags are reflected immediately (with polling interval)

## Management Workflow

1. **Create Announcement**: Add a new announcement object to the JSON array
2. **Update Existing**: Modify title, message, or type of existing announcements
3. **Remove Announcements**: Remove objects from the JSON array
4. **Disable System**: Set `announcements-enabled` to `false`
5. **Emergency Disable**: Quickly disable by setting the flag to `false`

## Best Practices

1. **Unique IDs**: Always use unique, descriptive IDs for announcements
2. **Clear Titles**: Keep titles short and use emojis for visual appeal
3. **Descriptive Messages**: Provide clear, actionable information
4. **Appropriate Types**: Use the correct type for visual consistency
5. **Timestamps**: Use accurate ISO 8601 timestamps for proper sorting
6. **Testing**: Test JSON validity before deploying to production

## Troubleshooting

### Common Issues

- **Bell not showing**: Check if `announcements-enabled` is `true`
- **No announcements**: Verify `announcements-config` JSON is valid
- **Using defaults**: Invalid JSON will fallback to hardcoded announcements
- **Read status issues**: Clear localStorage key `read-announcements` to reset

### JSON Validation Errors

If you see JSON parsing errors in the console:

1. **Syntax Error**: Check for missing commas, quotes, or brackets
2. **Invalid Format**: Ensure the config is a JSON array `[...]`
3. **Required Fields**: All announcements must have: `id`, `title`, `message`, `type`, `timestamp`
4. **Valid Types**: Type must be one of: `info`, `success`, `warning`, `error`

### Testing JSON Configuration

Use an online JSON validator to test your configuration before adding to ConfigCat:

```json
[
  {
    "id": "test-announcement",
    "title": "Test Announcement",
    "message": "This is a test message",
    "type": "info",
    "timestamp": "2025-08-31T12:00:00Z",
    "isNew": true
  }
]
```

### Debug Mode

Check the browser console for detailed error messages and validation warnings.

## Local Development

For local development, you can:

1. Set environment variables for ConfigCat
2. Use the hardcoded defaults by leaving `announcements-config` empty
3. Test with minimal JSON configurations first
