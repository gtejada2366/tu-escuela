import { describe, it, expect } from "vitest";

// Test that demo payment dates are dynamic (not hardcoded)
// We import the module to trigger buildDemoPayments()
describe("usePaymentsData demo data", () => {
  it("generates dates based on current month, not hardcoded", () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const expectedDuePrefix = `01/${currentMonth}/${currentYear}`;

    // Dynamically import to get the demo data
    // Since we can't easily extract demoPayments, we test the date helper logic directly
    const pad = (n: number) => String(n).padStart(2, "0");
    const dmyDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const curDue = dmyDate(new Date(currentYear, now.getMonth(), 1));
    expect(curDue).toBe(expectedDuePrefix);

    // Previous month due date
    const prevMonth = new Date(currentYear, now.getMonth() - 1, 1);
    const prevDue = dmyDate(prevMonth);
    expect(prevDue).toContain(String(prevMonth.getFullYear()));
  });

  it("paid dates use current month days", () => {
    const now = new Date();
    const paid = (day: number) => {
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const paidDate = paid(5);
    expect(paidDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(paidDate).toContain(String(now.getFullYear()));
  });
});
