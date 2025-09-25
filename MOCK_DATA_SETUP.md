# Quick Mock Data Setup Guide

## 🚀 **Immediate Setup (No Database Required)**

To test the Money Tracker UI with mock data right away:

### 1. Enable Mock Data
```bash
# Set environment variable
export NEXT_PUBLIC_USE_MOCK_DATA=true

# Or add to .env.local
echo "NEXT_PUBLIC_USE_MOCK_DATA=true" >> .env.local
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Money Tracker
- Navigate to `http://localhost:3000/money`
- You'll see the UI populated with realistic mock data
- Use the purple gear icon (bottom-right) for dev tools

## 📊 **What You'll See**

### **Dashboard Overview:**
- 5 people with various financial relationships
- 12 transactions with realistic amounts and descriptions
- Balance summaries showing who owes what
- Interactive charts and analytics

### **Sample Data:**
- **Alice Johnson**: Owes you $274.50 (3 transactions)
- **Bob Smith**: You owe $265.25 (3 transactions)  
- **Carol Davis**: Owes you $270.00 (2 transactions)
- **David Wilson**: Owes you $155.00 (2 transactions)
- **Emma Brown**: Owes you $25.75 (2 transactions)

### **Features You Can Test:**
- ✅ View transaction history
- ✅ Create new transactions
- ✅ Add new people
- ✅ View individual person details
- ✅ See balance calculations
- ✅ Interactive charts and graphs
- ✅ Filtering and sorting
- ✅ Error handling

## 🎛️ **Development Tools**

The floating purple gear icon provides:
- **Mock/Real Data Toggle**: Switch data sources instantly
- **Reset Data**: Return to initial mock dataset
- **Refresh**: Reload all data
- **Clear Errors**: Reset error states

## 🔧 **Database Setup (Optional)**

If you want to test with real data later:

### 1. Fix Database Functions (if needed)
If you see database function errors, run this in Supabase SQL Editor:

```sql
-- Copy and paste from fix-database-functions.sql
DROP FUNCTION IF EXISTS get_balance_summaries();
-- ... (rest of the fix script)
```

### 2. Configure Environment
```bash
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 **Benefits of Mock Data**

- **No Backend Setup**: Start testing UI immediately
- **Realistic Scenarios**: Comprehensive test data
- **Full Functionality**: All features work
- **Fast Development**: Instant responses
- **Easy Debugging**: Consistent, predictable data
- **Demo Ready**: Perfect for showcasing features

## 🔄 **Switching Between Mock and Real Data**

You can switch anytime:
1. **Via Dev Tools**: Click the toggle in the floating panel
2. **Via Environment**: Change `NEXT_PUBLIC_USE_MOCK_DATA`
3. **Programmatically**: Use `MoneyServiceFactory` methods

The mock data system is perfect for:
- 🎨 **UI Development**: Build and style components
- 🧪 **Feature Testing**: Test all functionality
- 🎭 **Demos**: Show off the application
- 🐛 **Debugging**: Consistent data for troubleshooting
- 📱 **Responsive Testing**: Test on different screen sizes

Start with mock data and switch to real data when you're ready! 🚀