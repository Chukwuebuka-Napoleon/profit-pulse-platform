# Profit Pulse Platform

Build a high-end Cryptocurrency Investment Platform called 'Profit Pulse' with a dark, modern fintech aesthetic (Neon Green and Charcoal Gray). The platform needs two distinct user experiences: a Client Dashboard and a hidden Admin Management Portal.

1. Landing Page:

Hero section with 'Start Investing' and 'View Demo' buttons.

Live Crypto Price Ticker (BTC, ETH, USDT) at the top.

Investment Plan Cards: 'Starter' (10% ROI), 'Silver' (20% ROI), and 'Gold' (35% ROI).

2. Client Portal (Authenticated):

Dashboard: Show 'Total Balance,' 'Total Profit,' and 'Active Deposits' in US Dollar.

Investment Interface: A way for users to select a plan, input an amount, and 'Commit' funds.

Transactions: A table showing Deposit/Withdrawal history with status badges (Pending, Confirmed, Cancelled).

Profile: Section for users to upload a 'KYC' document (Identity Verification).

3. Admin Portal (Route: /admin-dashboard):

User Management: List all registered users with their current balances.

Action Center: Buttons for the Admin to 'Approve Deposit,' 'Decline Withdrawal,' or 'Add Interest' to a specific user's account manually.

System Overview: Total platform liquidity and number of active investors.

4. Functional Requirements:

Use Lucide-react icons for the sidebar navigation.

Ensure all buttons on the landing page link to a functional 'Sign Up' or 'Login' modal.

Make the layout fully responsive for mobile investors.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d7c4a2a4-b17b-4ba1-8665-e9d5df9a0bc0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
