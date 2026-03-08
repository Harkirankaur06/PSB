import numpy as np


class AIEngine:

    # ---------------------------
    # Financial Health Score
    # ---------------------------
    def financial_health_score(self, income, expenses, savings, investments, debt):

        savings_rate = savings / income
        debt_ratio = debt / income
        investment_ratio = investments / income

        score = 0

        if savings_rate >= 0.3:
            score += 30
        elif savings_rate >= 0.2:
            score += 20
        else:
            score += 10

        if debt_ratio < 0.2:
            score += 20
        elif debt_ratio < 0.4:
            score += 10

        if investment_ratio > 2:
            score += 25
        elif investment_ratio > 1:
            score += 15

        if savings >= expenses * 6:
            score += 25

        return min(score, 100)

    # ---------------------------
    # Spending Analysis
    # ---------------------------
    def spending_analysis(self, income, expenses):

        ratio = expenses / income

        if ratio > 0.8:
            return "Your spending is very high compared to income."

        elif ratio > 0.6:
            return "You are spending a large portion of income."

        else:
            return "Your spending is under control."

    # ---------------------------
    # Recommendation Engine
    # ---------------------------
    def recommendations(self, income, expenses, savings, investments):

        rec = []

        savings_rate = savings / income

        if savings_rate < 0.2:
            rec.append("Increase savings to at least 20% of income.")

        if investments == 0:
            rec.append("Start a SIP investment to grow wealth.")

        if savings < expenses * 3:
            rec.append("Build emergency fund covering 3 months of expenses.")

        if expenses > income * 0.7:
            rec.append("Reduce discretionary spending.")

        return rec

    # ---------------------------
    # Wealth Projection
    # ---------------------------
    def wealth_projection(self, initial, monthly, years, rate=0.10):

        months = years * 12
        wealth = initial

        for _ in range(months):
            wealth = wealth * (1 + rate/12)
            wealth += monthly

        return round(wealth)

    # ---------------------------
    # Goal Prediction
    # ---------------------------
    def goal_prediction(self, goal_amount, current_savings, monthly_savings):

        remaining = goal_amount - current_savings

        if monthly_savings == 0:
            return {"years": None, "probability": 0}

        months = remaining / monthly_savings
        years = months / 12

        probability = max(20, 100 - years * 10)

        return {
            "years_to_goal": round(years, 1),
            "success_probability": min(100, probability)
        }

    # ---------------------------
    # Smart Savings Optimizer
    # ---------------------------
    def savings_optimizer(self, goal_amount, current_savings, years):

        months = years * 12
        required_monthly = (goal_amount - current_savings) / months

        return round(required_monthly)

    # ---------------------------
    # Digital Twin Simulation
    def digital_twin(self, initial, monthly, years):

     rate = 0.10
     months = years * 12

     wealth = initial

    # Normal scenario
     for _ in range(months):
        wealth = wealth * (1 + rate / 12)
        wealth += monthly

     normal = wealth

    # Job loss scenario (6 months no savings)
     wealth_job_loss = initial
     for i in range(months):
        wealth_job_loss = wealth_job_loss * (1 + rate / 12)

        if i > 6:
            wealth_job_loss += monthly

    # Market crash scenario (-30%)
     wealth_crash = normal * 0.7

    # Fraud loss scenario
     wealth_fraud = normal - 50000

     return {
        "normal_future_wealth": round(normal),
        "job_loss_future_wealth": round(wealth_job_loss),
        "market_crash_future_wealth": round(wealth_crash),
        "fraud_loss_future_wealth": round(wealth_fraud)
     }

    # ---------------------------
    # Risk Explanation
    # ---------------------------
    def risk_explanation(self, signals):

        explanations = []

        if "new_device" in signals:
            explanations.append("login from a new device")

        if "large_amount" in signals:
            explanations.append("transaction larger than normal")

        if "fast_action" in signals:
            explanations.append("action performed unusually fast")

        if "otp_retries" in signals:
            explanations.append("multiple OTP attempts detected")

        if not explanations:
            return "No suspicious signals detected."

        return "Risk detected due to " + ", ".join(explanations)