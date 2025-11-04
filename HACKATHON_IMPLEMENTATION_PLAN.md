# GreenRent - AI Hackathon Implementation Plan
## Pre-Hackathon Development Roadmap

---

## 🎯 PRIORITY: AI Features to Build/Demo

### ✅ ALREADY COMPLETED (Your Strong Foundation)
1. Full MERN Stack Application
2. User Authentication (Tenant/Landlord/Admin)
3. Property CRUD with Admin Verification
4. M-Pesa Payment Integration
5. Rent Wallet with Transactions
6. Property Verification Workflow
7. Landlord & Admin Dashboards

**Current Status:** You have a working MVP! Now add the AI magic ✨

---

## 🚀 SPRINT 1: AI Property Verification (Priority 1)
**Timeline:** 3-5 days
**Goal:** Demonstrate AI detecting fake property listings

### Task 1.1: Fake Image Detection API
**Tools:** Python + TensorFlow/PyTorch

```python
# app/ai_services/image_verification.py
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing import image
import numpy as np
import requests

class PropertyImageVerifier:
    def __init__(self):
        self.model = ResNet50(weights='imagenet')

    def detect_fake_image(self, image_url):
        """
        Check if image is stock photo or duplicate
        Returns: {is_authentic: bool, confidence: float}
        """
        # 1. Reverse image search via Google Vision API
        is_stock = self.check_reverse_image(image_url)

        # 2. Check for image manipulation
        is_edited = self.detect_manipulation(image_url)

        # 3. Verify metadata
        has_valid_metadata = self.check_exif_data(image_url)

        confidence = self.calculate_confidence_score(
            is_stock, is_edited, has_valid_metadata
        )

        return {
            'is_authentic': confidence > 0.7,
            'confidence': confidence,
            'flags': {
                'is_stock_photo': is_stock,
                'is_edited': is_edited,
                'has_metadata': has_valid_metadata
            }
        }

    def check_reverse_image(self, image_url):
        # Use Google Vision API or TinEye API
        # Return True if found elsewhere
        pass

    def detect_manipulation(self, image_path):
        # ELA (Error Level Analysis) for detecting edits
        pass

    def check_exif_data(self, image_url):
        # Extract GPS, camera info
        pass
```

**Backend Integration:**
```javascript
// backend/src/services/ai.service.js
import axios from 'axios';

export const verifyPropertyImages = async (images) => {
  const results = await Promise.all(
    images.map(async (img) => {
      const response = await axios.post(
        'http://localhost:8000/api/verify-image',
        { image_url: img.url }
      );
      return response.data;
    })
  );

  const fakeCount = results.filter(r => !r.is_authentic).length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  return {
    is_verified: fakeCount === 0 && avgConfidence > 0.75,
    results,
    summary: {
      total_images: images.length,
      authentic: images.length - fakeCount,
      suspicious: fakeCount,
      confidence: avgConfidence
    }
  };
};
```

**Quick Implementation (If No Time for ML):**
Use existing APIs:
- Google Cloud Vision API (reverse image search)
- Clarifai (image moderation)
- Imagga (auto-tagging)

### Task 1.2: Document OCR & Verification
**Tools:** Tesseract OCR + OpenAI API

```python
# app/ai_services/document_verification.py
import pytesseract
from PIL import Image
import openai
import re

class DocumentVerifier:
    def extract_property_details(self, document_image):
        """
        Extract text from title deed/ID using OCR
        """
        # OCR extraction
        text = pytesseract.image_to_string(Image.open(document_image))

        # Use OpenAI to structure the data
        prompt = f"""
        Extract structured information from this property document:

        {text}

        Return JSON with:
        - owner_name
        - property_id
        - location
        - size
        - registration_date
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        return json.loads(response.choices[0].message.content)

    def validate_id_number(self, id_number):
        """
        Validate Kenyan ID number format
        """
        # Kenyan ID: 8 digits
        pattern = r'^\d{8}$'
        return bool(re.match(pattern, str(id_number)))

    def cross_reference_data(self, extracted_data, submitted_data):
        """
        Compare OCR results with landlord-submitted data
        """
        matches = {
            'name': self.fuzzy_match(extracted_data['owner_name'], submitted_data['name']),
            'location': self.fuzzy_match(extracted_data['location'], submitted_data['location']),
            'property_id': extracted_data['property_id'] == submitted_data.get('property_id')
        }

        match_rate = sum(matches.values()) / len(matches)
        return {
            'is_valid': match_rate > 0.8,
            'match_rate': match_rate,
            'matches': matches
        }
```

**Fallback:** Just show OCR extraction in demo (Tesseract is free)

---

## 🚀 SPRINT 2: AI Rent Pricing Engine (Priority 2)
**Timeline:** 2-3 days
**Goal:** Show AI recommending fair rent prices

### Task 2.1: Collect Training Data
**Data Sources:**
1. Scrape existing rental sites (PigiaMe, BuyRentKenya)
2. Use your own platform data
3. Public datasets (Nairobi housing data)

**Data Collection Script:**
```python
# scripts/collect_rental_data.py
import pandas as pd
import requests
from bs4 import BeautifulSoup

def scrape_pigiame():
    """
    Scrape rental listings from PigiaMe
    """
    data = []
    for page in range(1, 50):  # Get 50 pages
        url = f"https://www.pigiame.co.ke/housing-rental?page={page}"
        # Scrape: rent, location, bedrooms, amenities
        # (Add scraping logic)
        pass
    return pd.DataFrame(data)

# Target: 1,000+ listings
rental_data = scrape_pigiame()
rental_data.to_csv('data/nairobi_rentals.csv')
```

### Task 2.2: Train Pricing Model
```python
# app/ai_services/rent_pricing.py
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
import pandas as pd

class RentPricingModel:
    def __init__(self):
        self.model = None

    def train(self, data_path='data/nairobi_rentals.csv'):
        df = pd.read_csv(data_path)

        # Feature engineering
        features = self.extract_features(df)
        X = features[['bedrooms', 'bathrooms', 'sq_meters',
                      'latitude', 'longitude', 'amenities_count',
                      'distance_to_cbd', 'neighborhood_score']]
        y = df['rent']

        # Train ensemble model
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

        rf = RandomForestRegressor(n_estimators=100)
        gb = GradientBoostingRegressor(n_estimators=100)

        rf.fit(X_train, y_train)
        gb.fit(X_train, y_train)

        # Ensemble average
        self.rf_model = rf
        self.gb_model = gb

        # Evaluate
        score = self.evaluate(X_test, y_test)
        print(f"Model R²: {score}")

        # Save model
        import joblib
        joblib.dump(self.rf_model, 'models/rent_pricing_rf.pkl')
        joblib.dump(self.gb_model, 'models/rent_pricing_gb.pkl')

    def predict_rent(self, property_features):
        """
        Predict optimal rent for a property
        """
        rf_pred = self.rf_model.predict([property_features])
        gb_pred = self.gb_model.predict([property_features])

        # Ensemble average
        predicted_rent = (rf_pred[0] + gb_pred[0]) / 2

        # Calculate confidence interval
        std_dev = abs(rf_pred[0] - gb_pred[0]) / 2
        lower_bound = predicted_rent - std_dev
        upper_bound = predicted_rent + std_dev

        return {
            'predicted_rent': int(predicted_rent),
            'range': {
                'min': int(lower_bound),
                'max': int(upper_bound)
            },
            'confidence': 0.85,  # Based on model R²
            'market_position': self.get_market_position(predicted_rent)
        }

    def get_market_position(self, rent):
        # Compare to neighborhood average
        if rent < 15000:
            return "Budget-friendly"
        elif rent < 30000:
            return "Mid-range"
        else:
            return "Premium"
```

**Backend Endpoint:**
```javascript
// backend/src/routes/ai.routes.js
router.post('/predict-rent', protect, async (req, res) => {
  const { bedrooms, bathrooms, location, amenities } = req.body;

  try {
    const response = await axios.post('http://localhost:8000/api/predict-rent', {
      bedrooms,
      bathrooms,
      sq_meters: req.body.size,
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
      amenities_count: amenities.length
    });

    return ApiResponse.success(res, 200, 'Rent prediction generated', {
      prediction: response.data
    });
  } catch (error) {
    return ApiResponse.error(res, 500, 'AI service unavailable');
  }
});
```

**Quick Demo Version:** Use simple formula if no time for ML:
```javascript
function predictRent(property) {
  // Simple heuristic model
  const baseRent = 8000;
  const bedroomFactor = property.bedrooms * 5000;
  const locationMultiplier = getLocationMultiplier(property.city);
  const amenitiesBonus = property.amenities.length * 500;

  const estimatedRent = (baseRent + bedroomFactor) * locationMultiplier + amenitiesBonus;

  return {
    predicted_rent: estimatedRent,
    range: {
      min: estimatedRent * 0.9,
      max: estimatedRent * 1.1
    },
    confidence: 0.82
  };
}
```

---

## 🚀 SPRINT 3: Smart Savings Assistant (Priority 3)
**Timeline:** 1-2 days
**Goal:** ML-powered savings recommendations

### Task 3.1: Savings Recommendation Engine
```python
# app/ai_services/savings_assistant.py
from sklearn.linear_model import LinearRegression
import numpy as np

class SavingsAssistant:
    def recommend_savings_plan(self, user_profile):
        """
        Generate personalized savings recommendation
        """
        income = user_profile['monthly_income']
        expenses = user_profile['avg_monthly_expenses']
        rent_target = user_profile['target_rent']
        months_to_save = user_profile.get('target_months', 6)

        # Calculate disposable income
        disposable = income - expenses

        # ML model predicts optimal savings rate
        # (For demo, use heuristic)
        if disposable < 0:
            return {'error': 'Expenses exceed income'}

        # Recommend 20-40% of disposable income
        optimal_savings = disposable * 0.30

        # Daily savings
        daily_amount = optimal_savings / 30

        # Predict completion
        months_needed = rent_target / optimal_savings
        success_probability = self.predict_success(
            daily_amount, income, user_profile['past_savings_behavior']
        )

        return {
            'recommended_daily': int(daily_amount),
            'recommended_monthly': int(optimal_savings),
            'months_to_goal': int(months_needed),
            'success_probability': success_probability,
            'insights': [
                f"Save KES {int(daily_amount)} daily",
                f"You'll reach your goal in {int(months_needed)} months",
                f"{int(success_probability*100)}% chance of success based on your profile"
            ],
            'tips': self.generate_tips(user_profile)
        }

    def predict_success(self, daily_amount, income, past_behavior):
        # ML model to predict if user will stick to plan
        # For demo: simple heuristic
        if daily_amount / income < 0.05:
            return 0.95  # Very easy
        elif daily_amount / income < 0.10:
            return 0.82  # Moderate
        else:
            return 0.65  # Challenging

    def generate_tips(self, user_profile):
        tips = [
            "Set up auto-debit on salary day",
            "Use our streak feature to stay motivated",
            "Join a savings challenge for bonus rewards"
        ]
        return tips
```

**Frontend Integration:**
```typescript
// frontend/app/wallet/savings-assistant/page.tsx
const getSavingsRecommendation = async () => {
  const response = await fetch('/api/ai/savings-recommendation', {
    method: 'POST',
    body: JSON.stringify({
      monthly_income: userIncome,
      avg_monthly_expenses: userExpenses,
      target_rent: targetRent,
      past_savings_behavior: savingsHistory
    })
  });

  const recommendation = await response.json();
  setRecommendation(recommendation);
};
```

---

## 🎨 SPRINT 4: UI/UX for AI Features
**Timeline:** 1 day

### Add AI Badges & Indicators
```tsx
// Show verification status
<div className="flex items-center gap-2">
  {property.verification.status === 'approved' && (
    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
      <CheckCircleIcon className="w-4 h-4" />
      AI-Verified
    </span>
  )}
</div>

// Show AI pricing insights
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-center gap-2 mb-2">
    <SparklesIcon className="w-5 h-5 text-blue-600" />
    <span className="font-semibold text-blue-900">AI Pricing Insights</span>
  </div>
  <p className="text-sm text-blue-700">
    This property is priced <strong>12% below</strong> market average for the area.
    Predicted fair rent: <strong>KES {aiPrediction.predicted_rent.toLocaleString()}</strong>
  </p>
</div>
```

---

## 🧪 SPRINT 5: Demo Data & Testing
**Timeline:** 1 day

### Create Demo Dataset
```javascript
// scripts/seed-demo-data.js
const demoProperties = [
  {
    name: "Kilimani 2BR Apartment",
    location: { lat: -1.2921, lng: 36.7856 },
    rent: 35000,
    images: [
      "https://real-image-url.com/property1.jpg",  // Real property
      "https://stock-photo.com/fake.jpg"  // Fake image for demo
    ]
  },
  // Add 10-20 properties
];

// Seed database
await Property.insertMany(demoProperties);
```

### Test Scenarios
1. **Fake Image Detection:** Upload stock photo → AI flags it
2. **Real Image Pass:** Upload real property photo → AI approves
3. **Rent Pricing:** Enter property details → Get AI recommendation
4. **Savings Plan:** Input income → Get personalized plan

---

## 📊 DEMO PREPARATION

### 1. Setup AI Service (Python Flask)
```python
# app/main.py
from flask import Flask, request, jsonify
from ai_services.image_verification import PropertyImageVerifier
from ai_services.rent_pricing import RentPricingModel
from ai_services.savings_assistant import SavingsAssistant

app = Flask(__name__)

# Initialize AI models
image_verifier = PropertyImageVerifier()
rent_model = RentPricingModel()
savings_assistant = SavingsAssistant()

@app.route('/api/verify-image', methods=['POST'])
def verify_image():
    image_url = request.json['image_url']
    result = image_verifier.detect_fake_image(image_url)
    return jsonify(result)

@app.route('/api/predict-rent', methods=['POST'])
def predict_rent():
    features = request.json
    prediction = rent_model.predict_rent(features)
    return jsonify(prediction)

@app.route('/api/savings-recommendation', methods=['POST'])
def savings_recommendation():
    user_profile = request.json
    recommendation = savings_assistant.recommend_savings_plan(user_profile)
    return jsonify(recommendation)

if __name__ == '__main__':
    app.run(port=8000)
```

### 2. Deploy AI Service
```bash
# Option 1: Local (for demo)
cd ai_services
pip install -r requirements.txt
python main.py

# Option 2: Docker
docker build -t greenrent-ai .
docker run -p 8000:8000 greenrent-ai

# Option 3: Cloud (Heroku/Railway)
railway up
```

### 3. Update Environment Variables
```bash
# backend/.env
AI_SERVICE_URL=http://localhost:8000
OPENAI_API_KEY=your_key_here  # For document analysis
GOOGLE_VISION_API_KEY=your_key_here  # For image verification
```

---

## 🎯 MINIMUM VIABLE DEMO (If Time is Short)

**Priority Features to Show:**
1. ✅ Working platform (already done)
2. 🔥 Fake image detection (use Google Vision API - no ML needed)
3. 🔥 Rent price prediction (simple heuristic model)
4. ⚡ Admin verification workflow (already done)

**Skip if necessary:**
- Complex ML training (use pre-trained models)
- Document OCR (just show concept)
- Savings ML (use rule-based system)

---

## 📋 PRE-HACKATHON CHECKLIST

### Week Before Hackathon:
- [ ] AI services running locally
- [ ] Demo data seeded (20 properties)
- [ ] Test all AI endpoints
- [ ] Prepare backup video demo
- [ ] Practice 5-minute pitch
- [ ] Print pitch deck
- [ ] Test internet connection requirements

### Day Before:
- [ ] Full system test
- [ ] Charge all devices
- [ ] Download offline docs
- [ ] Backup code on USB
- [ ] Prepare Q&A answers

### Hackathon Day:
- [ ] Arrive early for setup
- [ ] Test projector connection
- [ ] Run smoke tests
- [ ] Deep breath - you've got this! 🚀

---

## 🛠 TECHNOLOGY STACK SUMMARY

**Current (Already Built):**
- Frontend: Next.js 14, React, TypeScript, TailwindCSS
- Backend: Node.js, Express, MongoDB
- Payments: M-Pesa Daraja API
- Auth: JWT

**To Add (AI Layer):**
- AI Service: Python Flask
- ML Libraries: TensorFlow/Scikit-learn
- APIs: Google Vision, OpenAI GPT-4
- Data: Pandas, NumPy
- Deployment: Docker, Railway/Heroku

---

## 💰 BUDGET (If Needed)

**Essential:**
- Google Cloud Vision API: ~$5 (1,000 image calls)
- OpenAI API: ~$10 (GPT-4 usage)
- Hosting (Railway/Heroku): Free tier

**Optional:**
- Domain + SSL: ~$15
- Better hosting: ~$20/month

**Total: ~$30 for hackathon demo**

---

## 🎬 FINAL ADVICE

1. **Focus on the Story:** Show how AI solves real problems (Mary's story with fake listing)

2. **Live Demo is King:** Even if AI is simple, show it WORKING

3. **Data > Claims:** "94% accuracy" beats "our AI is great"

4. **Have Backups:** Video demo if internet fails

5. **Practice, Practice:** Nail that 5-minute pitch

6. **Show Passion:** Judges invest in people, not just tech

---

**You've got this! 🚀**

The foundation is solid. Add the AI magic, tell a compelling story, and show the impact. GreenRent is solving a REAL problem with REAL technology. That's a winning combination! 🏆
