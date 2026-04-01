# Fusion Metrics

A web application for tracking and visualizing metrics from the Fusion API. Monitor user activity, design exports, code merges, and other key metrics across your companies and spaces.

## Features

- **Multi-Company Support**: Manage and track metrics for multiple companies
- **API Integration**: Connect to the Fusion Metrics API using secure API credentials
- **Date Range Filtering**: View metrics for any month and year
- **Space Filtering**: Filter metrics by individual spaces or view all spaces at once
- **Metrics Dashboard**: Display key metrics including:
  - User prompts
  - Design exports
  - PRs merged
  - Lines of code
  - Credits used
  - User count
  - Events
- **Data Visualization**: Charts and tables for easy metrics analysis
- **Local Caching**: Efficient caching of metrics data for improved performance
- **Responsive Design**: Clean, modern UI built with Lit and TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+ with npm
- Fusion API credentials (public and private keys)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start at `http://localhost:5173` (or your configured dev port).

### Build

```bash
npm run build
```

### Type Checking & Linting

```bash
npm run check
```

## Configuration

### Adding a Company

1. Click the **Add** button in the header
2. Enter the company name
3. Enter your Fusion Metrics API private key
4. Click **Connect** to verify the credentials
5. Once connected, click **Save**

### Editing Company Settings

1. Select a company from the dropdown
2. Click the **Edit** button
3. Update the company name or private key
4. Click **Save** to apply changes
5. Click **Delete** to remove the company permanently

## API Integration

The application communicates with the Fusion Metrics API using bearer token authentication. The private key is sent in the `Authorization` header with the format:

```
Authorization: Bearer <private_key>
```

Metrics are fetched for the selected month/year date range. The API response includes:

- User prompts
- Design exports
- PRs merged
- Lines of code
- Credits used
- User count
- Events
- Space-specific metrics

## Data Storage

- **Companies**: Stored in browser's IndexedDB for persistence across sessions
- **Metrics**: Cached locally to reduce API calls for the same date ranges

## Technology Stack

- **Framework**: [Lit](https://lit.dev/) - Lightweight web components
- **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- **Charts**: [Recharts](https://recharts.org/) - React-based charting library
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast frontend build tool
- **Language**: TypeScript

## Project Structure

```
src/
├── components/         # Lit web components
│   ├── company-app.ts            # Main application component
│   ├── company-header.ts         # Header with company selector
│   ├── company-dialog.ts         # Edit/add company dialog
│   ├── company-summary.ts        # Metrics summary view
│   ├── metrics-charts.ts         # Chart visualizations
│   ├── selected-company-card.ts  # Company info card
│   └── ...
├── lib/
│   ├── company-store.ts          # Company data management
│   └── metrics-cache.ts          # Metrics caching logic
├── main.ts                       # Application entry point
└── style.css                     # Global styles
```

## Development

### Code Quality

The project uses TypeScript for type safety and includes linting and formatting checks via `npm run check`.

### Adding New Features

1. Create new components in `src/components/`
2. Update the main `company-app.ts` to integrate new components
3. Add any new data management logic to `src/lib/`
4. Run type checking and linting before committing

## Troubleshooting

### "Private key is required to fetch metrics"

The selected company doesn't have a valid API private key configured. Edit the company settings and enter a valid private key.

### Connection Successful but No Data

The Fusion Metrics API may not have data for the selected date range. Try selecting a different month/year or verify the company has active metrics.

### Metrics Not Loading

1. Check your internet connection
2. Verify the API credentials are correct
3. Check the browser console for detailed error messages
4. Try clearing the browser cache

## License

MIT
