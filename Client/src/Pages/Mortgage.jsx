import { useMemo, useState } from "react";
import "../css/Mortgage.css";
import RealEstateFooter from "../Components/Common/RealEstateFooter";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Mortgage() {
  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [depositPercent, setDepositPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [years, setYears] = useState(30);

  const results = useMemo(() => {
    const deposit = propertyPrice * (depositPercent / 100);
    const loanAmount = propertyPrice - deposit;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = years * 12;

    let monthlyPayment = 0;

    if (numberOfPayments > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loanAmount / numberOfPayments;
      } else {
        const factor = Math.pow(1 + monthlyRate, numberOfPayments);

        monthlyPayment =
          (loanAmount * monthlyRate * factor) / (factor - 1);
      }
    }

    const totalRepayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalRepayment - loanAmount;

    return {
      deposit,
      loanAmount,
      monthlyPayment,
      totalRepayment,
      totalInterest,
    };
  }, [propertyPrice, depositPercent, interestRate, years]);

  return (
    <main className="mortgage-page">
      {/* HERO */}
      <section className="mortgage-hero">
        <div className="mortgage-hero__content">
          <span>PLAN YOUR NEXT PROPERTY PURCHASE</span>
          <h1>Make your property goals a reality.</h1>
          <p>
            Understand your estimated mortgage repayments and plan
            your finances before making a property decision.
          </p>

          <a href="#mortgage-calculator">
            Calculate Your Mortgage
          </a>
        </div>
      </section>

      {/* INTRO */}
      <section className="mortgage-intro">
        <span className="mortgage-section-label">MORTGAGE PLANNING</span>
        <h2>Know what your property could cost each month</h2>
        <p>
          Use our mortgage calculator to estimate your deposit,
          loan amount and monthly repayments.
        </p>
      </section>

      {/* CALCULATOR */}
      <section
        id="mortgage-calculator"
        className="mortgage-calculator-section"
      >
        <div className="mortgage-calculator">
          <div className="mortgage-input-panel">
            <div className="mortgage-panel-heading">
              <span>YOUR PROPERTY DETAILS</span>
              <h2>Mortgage Calculator</h2>
              <p>Adjust the values to explore different scenarios.</p>
            </div>

            <div className="mortgage-field">
              <label htmlFor="property-price">Property Price</label>

              <div className="mortgage-number-input">
                <span>$</span>
                <input
                  id="property-price"
                  type="number"
                  min="50000"
                  step="5000"
                  value={propertyPrice}
                  onChange={(event) =>
                    setPropertyPrice(
                      Math.max(50000, Number(event.target.value) || 0)
                    )
                  }
                />
              </div>
            </div>

            <div className="mortgage-field">
              <div className="mortgage-label-row">
                <label htmlFor="deposit">Down Payment</label>
                <strong>{depositPercent}%</strong>
              </div>

              <input
                id="deposit"
                className="mortgage-range"
                type="range"
                min="5"
                max="80"
                step="5"
                value={depositPercent}
                onChange={(event) =>
                  setDepositPercent(Number(event.target.value))
                }
              />

              <div className="mortgage-range-labels">
                <span>5%</span>
                <span>80%</span>
              </div>
            </div>

            <div className="mortgage-field">
              <div className="mortgage-label-row">
                <label htmlFor="interest">Annual Interest Rate</label>
                <strong>{interestRate}%</strong>
              </div>

              <input
                id="interest"
                className="mortgage-range"
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={interestRate}
                onChange={(event) =>
                  setInterestRate(Number(event.target.value))
                }
              />

              <div className="mortgage-range-labels">
                <span>1%</span>
                <span>15%</span>
              </div>
            </div>

            <div className="mortgage-field">
              <div className="mortgage-label-row">
                <label htmlFor="years">Repayment Period</label>
                <strong>{years} years</strong>
              </div>

              <input
                id="years"
                className="mortgage-range"
                type="range"
                min="1"
                max="30"
                step="1"
                value={years}
                onChange={(event) =>
                  setYears(Number(event.target.value))
                }
              />

              <div className="mortgage-range-labels">
                <span>1 year</span>
                <span>30 years</span>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div className="mortgage-results-panel">
            <span className="mortgage-results-eyebrow">
              YOUR ESTIMATED REPAYMENT
            </span>

            <p className="mortgage-monthly-label">
              Monthly repayment
            </p>

            <h2>{formatCurrency(results.monthlyPayment)}</h2>

            <span className="mortgage-results-caption">
              For {years} years at {interestRate}% annual interest
            </span>

            <div className="mortgage-result-divider" />

            <div className="mortgage-result-row">
              <span>Property price</span>
              <strong>{formatCurrency(propertyPrice)}</strong>
            </div>

            <div className="mortgage-result-row">
              <span>Your down payment ({depositPercent}%)</span>
              <strong>{formatCurrency(results.deposit)}</strong>
            </div>

            <div className="mortgage-result-row">
              <span>Loan amount</span>
              <strong>{formatCurrency(results.loanAmount)}</strong>
            </div>

            <div className="mortgage-result-row">
              <span>Total interest</span>
              <strong>{formatCurrency(results.totalInterest)}</strong>
            </div>

            <div className="mortgage-total">
              <span>Total repayment</span>
              <strong>
                {formatCurrency(results.totalRepayment)}
              </strong>
            </div>

            <p className="mortgage-disclaimer">
              This is an illustrative principal-and-interest estimate,
              not a mortgage offer. It excludes property taxes,
              homeowners insurance, mortgage insurance, HOA fees,
              closing costs and other charges. Actual repayments
              depend on lender terms and your circumstances.
            </p>
          </div>
        </div>
      </section>

      {/* INFORMATION */}
      <section className="mortgage-info">
        <div>
          <span className="mortgage-section-label">
            UNDERSTANDING MORTGAGES
          </span>
          <h2>What goes into a mortgage?</h2>
        </div>

        <div className="mortgage-info-grid">
          <article>
            <div>01</div>
            <h3>Down Payment</h3>
            <p>
              The amount you contribute upfront towards the purchase
              of a property. It reduces the amount you need to borrow.
            </p>
          </article>

          <article>
            <div>02</div>
            <h3>Interest Rate</h3>
            <p>
              The rate charged by a lender for borrowing money.
              It affects how much you repay over time.
            </p>
          </article>

          <article>
            <div>03</div>
            <h3>Repayment Period</h3>
            <p>
              The length of time agreed with a lender to repay
              the mortgage. A 30-year term is one common US option.
            </p>
          </article>
        </div>
      </section>
      <RealEstateFooter />
    </main>
  );
}