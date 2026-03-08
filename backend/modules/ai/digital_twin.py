def simulate_digital_twin(initial, monthly, years):

    rate = 0.10
    months = years * 12

    wealth = initial

    for i in range(months):
        wealth = wealth * (1 + rate/12)
        wealth += monthly

    normal = wealth

    # Scenario 1: Job loss (no savings for 6 months)
    wealth_job_loss = initial
    for i in range(months):
        wealth_job_loss = wealth_job_loss * (1 + rate/12)

        if i > 6:
            wealth_job_loss += monthly

    # Scenario 2: Market crash (-30%)
    wealth_crash = normal * 0.7

    # Scenario 3: Fraud loss
    wealth_fraud = normal - 50000

    return {
        "normal_future_wealth": round(normal),
        "job_loss_impact": round(wealth_job_loss),
        "market_crash_impact": round(wealth_crash),
        "fraud_loss_impact": round(wealth_fraud)
    }