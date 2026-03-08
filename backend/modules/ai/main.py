from fastapi import FastAPI
from ai_engine import AIEngine

app = FastAPI()

# Initialize AI Engine
ai = AIEngine()


# --------------------------------
# Root Endpoint (Health Check)
# --------------------------------
@app.get("/")
def home():
    return {"message": "AI Finance Module Running"}


# --------------------------------
# AI Insights (Dashboard)
# --------------------------------
@app.post("/ai/insights")
def insights(data: dict):

    score = ai.financial_health_score(
        data["income"],
        data["expenses"],
        data["savings"],
        data["investments"],
        data["debt"]
    )

    spending = ai.spending_analysis(
        data["income"],
        data["expenses"]
    )

    rec = ai.recommendations(
        data["income"],
        data["expenses"],
        data["savings"],
        data["investments"]
    )

    return {
        "financial_health_score": score,
        "spending_analysis": spending,
        "recommendations": rec
    }


# --------------------------------
# Wealth Simulation (Future Simulator)
# --------------------------------
@app.post("/ai/simulation")
def simulation(data: dict):

    wealth = ai.wealth_projection(
        data["initial"],
        data["monthly"],
        data["years"]
    )

    return {
        "future_wealth": wealth
    }


# --------------------------------
# Goal Prediction
# --------------------------------
@app.post("/ai/goal")
def goal(data: dict):

    result = ai.goal_prediction(
        data["goal_amount"],
        data["current_savings"],
        data["monthly_savings"]
    )

    return result


# --------------------------------
# Smart Savings Optimizer
# --------------------------------
@app.post("/ai/savings-optimizer")
def optimizer(data: dict):

    required = ai.savings_optimizer(
        data["goal_amount"],
        data["current_savings"],
        data["years"]
    )

    return {
        "required_monthly_savings": required
    }


# --------------------------------
# Digital Twin Financial Simulation
# --------------------------------
@app.post("/ai/digital-twin")
def digital_twin(data: dict):

    result = ai.digital_twin(
        data["initial"],
        data["monthly"],
        data["years"]
    )

    return result


# --------------------------------
# Risk Explanation Engine
# --------------------------------
@app.post("/ai/risk-explanation")
def risk(data: dict):

    explanation = ai.risk_explanation(
        data["signals"]
    )

    return {
        "risk_explanation": explanation
    }