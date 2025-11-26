# 🏠 Homebase

## 📌 Project Description

This project is a **Student Housing Digital Platform** designed to help university students, especially first-years, find safe, affordable, and verified accommodation near their campuses.  

The platform connects **students, landlords, and trusted agents** by providing:  
- ✅ Verified house listings with real photos, videos, and amenities  
- 🔎 Smart search & filters (budget, distance, house type, facilities)  
- 🏠 Virtual house tours (360° or video walkthroughs)  
- 💳 Secure booking & payments to prevent scams  
- ⭐ Student reviews & ratings for transparency and trust  
- 🤝 Peer-to-peer support (forums, roommate search, scam reporting)  
- 📦 Extra services such as moving assistance, internet setup, and furniture rentals  

By reducing agent dependency, scams, and hidden costs, this platform ensures a **transparent, affordable, and safe housing experience** for students.  


---

## ⚙️ Implementation Details

### 🔹 Core Modules
1. **Authentication & User Roles**  
   - Role-based accounts: Student, Landlord, Agent, Admin  
   - Secure login with email/Google authentication  
   - Profile management (ID verification for landlords/agents)  

2. **Housing Listings**  
   - Verified listings with photos, videos, and amenities  
   - Smart filters (budget, distance, house type, Wi-Fi, water, security, etc.)  
   - Location mapping with distance to campus  

3. **Search & Recommendation Engine**  
   - Keyword search + advanced filters  
   - Recommendation system suggesting houses based on preferences and past searches  

4. **Virtual Viewing**  
   - 360° tours and video walkthroughs  
   - Photo galleries of rooms and facilities  

5. **Booking & Escrow Payments**  
   - Students reserve houses through the platform  
   - Payments held in **escrow** until house confirmation  
   - Refunds handled automatically if listing does not match  

6. **Reviews & Ratings**  
   - Students review landlords, agents, and properties  
   - Transparent rating system to prevent exploitation  
   - Bad actors flagged/banned by admins  

7. **Communication & Support**  
   - In-app chat between students and landlords/agents  
   - Scam reporting system  
   - Student-to-student forums and roommate search  

8. **Extra Services**  
   - Partnerships with movers, internet providers, and furniture rental companies  
   - Students can book extra services directly via the platform  

---

## 🛠️ Technology Stack
- **Frontend:** React / Next.js (web), React Native (mobile)  
- **Backend:** Django REST Framework or Express.js (Node.js)  
- **Database:** PostgreSQL / Supabase (cloud-hosted)  
- **Authentication:** NextAuth.js / JWT-based sessions  
- **Payments:** Mobile money (M-Pesa), PayPal, or Stripe (with escrow logic)  
- **Hosting:** Vercel (frontend), Render/Heroku/DigitalOcean (backend)  

---

## 📂 Project Structure
- `/frontend` → React/Next.js web application  
- `/mobile` → React Native mobile app  
- `/backend` → Django REST API  backend  
- `/docs` → Documentation and project proposal  

---

## 🔧 Installation & Setup

1. Clone the repository  
   ```bash
   git clone https://github.com/jtech-JM/Homebase_repo.git
   cd homebase
# Homebase_repo
