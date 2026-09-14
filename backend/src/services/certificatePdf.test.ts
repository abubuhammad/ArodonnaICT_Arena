import { certificatePdfBuffer } from "./certificatePdf";

describe("certificatePdfBuffer", () => {
  it("generates a non-empty PDF using an instructor template", async () => {
    const buffer = await certificatePdfBuffer({
      learnerName: "Ada Learner",
      courseTitle: "Web Development",
      instructorName: "Grace Instructor",
      serial: "CERT-123",
      issuedAt: new Date("2026-09-11T00:00:00Z"),
      template: { title: "Mastery Certificate", accentColor: "#0f766e" },
    });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });
});
