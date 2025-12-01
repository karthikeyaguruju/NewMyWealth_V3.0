# My Finance Dashboard

A comprehensive personal finance management application built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

## Features

- ✅ **User Authentication** - Secure signup/login with JWT
- 📊 **Dashboard** - Visual analytics with 8 key financial metrics
- 💰 **Transaction Management** - Track income, expenses, and investments
- 📈 **Investment Tracking** - Monitor investment allocation and trends
- 🏷️ **Category Management** - Customize categories or use defaults
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with httpOnly cookies
- **UI Components**: Headless UI
- **Icons**: Lucide React
- **Charts**: Recharts (to be implemented)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local` and update with your values:
   ```
   DATABASE_URL="your-mongodb-connection-string"
   JWT_SECRET="your-secret-key"
   NEXT_PUBLIC_APP_NAME="My Finance Dashboard"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Categories

The application comes with pre-configured categories:

**Income**: Salary, Freelancing, Side Hustle, Tuition

**Expense**: Rents, Insurance, Mobile Recharge, Food/Grocery, Fun, Beauty, Bike EMI, Phone EMI, Miscellaneous, Children, Investment

**Investment**: Stocks, Mutual Funds, Fixed Deposit, PPF, NPS, Bonds

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── transactions/      # Transactions page
│   ├── investments/       # Investments page
│   ├── categories/        # Categories management
│   ├── login/            # Login page
│   └── signup/           # Signup page
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── Layout/           # Layout components
├── contexts/             # React contexts
├── lib/                  # Utility functions
└── prisma/              # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
