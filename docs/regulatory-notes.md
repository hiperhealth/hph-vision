# Regulatory and Safety Notes

This document outlines the regulatory boundary, clinical intent, safety design, and data privacy framework for the `hphvision` smartphone-based vision screening and prescription estimation platform.

---

## 1. Intended Use

`hphvision` is intended for:

- **Guided Visual Acuity Screening:** Self-testing of distance visual acuity (monocular visual acuity using logMAR/Snellen equivalents based on the Tumbling E optotype).
- **Subjective Refraction Estimation Support:** Providing a controlled, step-by-step subjective comparison workflow to estimate spherical and cylindrical refractive error changes.
- **Cardboard Visor Calibration:** Utilizing dynamic paper/cardboard visor templates derived from device screen dimensions (PPI and chassis layout) to establish and maintain the standardized testing distance (e.g., 40 cm for near-refraction or standard scaling for distance visual acuity).
- **Clinician Review Support:** Exporting structured testing metrics (JSON/PDF report format) to facilitate review, validation, or renewal workflows by a licensed optometrist or ophthalmologist.

### Target Population

- Adult users (18 years and older) who are capable of understanding and following self-guided mobile phone visual and audio instructions.

---

## 2. Non-Intended Use (Out of Scope)

`hphvision` is **not** intended for:

- **Autonomous Clinical Diagnosis:** The system must not diagnose, treat, prevent, or cure any eye disease, refractive pathology, or sight-threatening condition.
- **Pediatric Vision Screening:** The automated state machines and templates are not calibrated for children or adolescent users whose refractive systems are developing rapidly.
- **Direct Eyeglass Prescription Issuance:** The app must not issue a legal eyeglass or contact lens prescription directly to the user without prior independent review and signature by a qualified, licensed clinician.
- **Emergency Ocular Care Triage:** The app is not a substitute for immediate emergency ophthalmic evaluation.

---

## 3. Core Safety Disclaimers

The following disclaimers must be prominently displayed during onboarding (`DisclaimerScreen.tsx`) and attached to all exported clinician reports:

> **IMPORTANT CLINICAL NOTICE**
> This smartphone application provides a guided vision screening and prescription _estimation_ helper. It is **NOT** a replacement for a comprehensive eye examination by an optometrist or ophthalmologist.
>
> A full clinical eye exam is required to evaluate overall ocular health, measure intraocular pressure, and screen for silent sight-threatening conditions such as glaucoma, macular degeneration, and diabetic retinopathy.
>
> **Never modify your corrective lens prescription or purchase new eyewear based solely on these screening results without verification and approval from a licensed eye care professional.**

---

## 4. Exclusion of Autonomous Diagnosis

To comply with international medical device regulatory standards (such as FDA Class II/Software as a Medical Device (SaMD) and EU MDR Class IIa/IIb classification rules for diagnostics):

1. **Physical Limitation of Sensors:** A smartphone front/rear camera and screen cannot perform tonometry (eye pressure), ophthalmoscopy (retina/fundus imaging), or slit-lamp biomicroscopy (anterior segment analysis).
2. **Clinical Risk Mitigation:** Autonomous diagnostic claims carry high clinical risk if a pathology is missed (false negative). Therefore, the platform strictly positions itself as an **information-gathering and screening tool** that feeds data directly into a clinician-in-the-loop review pipeline.

---

## 5. Triage Flow and Safety Red-Flags

Before starting any vision test, the patient is required to complete the Safety Triage flow. The application evaluates answers using the clinical rules engine configured in `packages/mobile-lib/src/triage/rules.ts` and `questions.ts`.

If a user answers **"Yes"** to any of the safety red flags, the self-test is immediately blocked (`canContinueSelfTest: false`), and they are routed to a triage guidance page.

### Triage Question Configuration

| Question ID             | Symptom / Red Flag                | Severity / Trigger | Action on Positive Answer                                      |
| :---------------------- | :-------------------------------- | :----------------- | :------------------------------------------------------------- |
| `sudden-vision-loss`    | Sudden vision loss                | Urgent / Critical  | **Block self-test**; Route to Urgent Care recommendation       |
| `eye-pain`              | Active eye pain                   | Urgent / Critical  | **Block self-test**; Route to Urgent Care recommendation       |
| `flashes-or-floaters`   | New flashes or floaters           | Urgent / Critical  | **Block self-test**; Route to Urgent Care recommendation       |
| `recent-eye-trauma`     | Recent eye trauma                 | Urgent / Critical  | **Block self-test**; Route to Urgent Care recommendation       |
| `double-vision`         | Double vision                     | Standard Warning   | **Block self-test**; Route to Professional Care recommendation |
| `severe-redness`        | Severe eye redness                | Standard Warning   | **Block self-test**; Route to Professional Care recommendation |
| `known-glaucoma`        | Diagnosed with glaucoma           | Standard Warning   | **Block self-test**; Route to Professional Care recommendation |
| `diabetes-related-risk` | Diabetes-related eye disease risk | Standard Warning   | **Block self-test**; Route to Professional Care recommendation |
| `recent-eye-surgery`    | Recent eye surgery                | Standard Warning   | **Block self-test**; Route to Professional Care recommendation |

---

## 6. Physical and Environmental Limitations

Users must be informed of the following limitations that can degrade the accuracy of smartphone-based refractive testing:

- **Ambient Lighting Variability:** Excessively bright or dark environments alter pupil dilation and screen glare, affecting contrast threshold measurements.
- **Screen Display Metrics:** Variance in screen brightness, screen degradation, and color temperature can affect visual stimulus rendering.
- **Cardboard Visor Construction Errors:** If the printable paper/cardboard visor template is printed with incorrect scaling options (e.g. "Fit to Page" instead of "Actual Size") or assembled incorrectly, the physical testing distance will deviate from the mathematical model, yielding inaccurate results.
- **Accommodation Fatigue:** Staring at mobile screens causes ciliary muscle accommodation, which can lead to over-minus estimations in refraction.

---

## 7. Data Privacy and Security Considerations

To ensure compliance with health privacy regulations (such as HIPAA in the US and GDPR in the EU), the platform adheres to the following privacy-by-design requirements:

- **No Direct Patient Identifiers (PII):** The mobile application generates client-side unique session identifiers (`sessionId`) based on epoch timestamps. The app does not save or transmit names, social security numbers, or addresses.
- **Short-Lived Signed URLs:** PDF documents generated for clinical review must be stored securely. Access must be managed via short-lived download links to prevent unauthorized data exposure.
- **Local Onboarding Storage:** Onboarding responses are kept locally in the client state context (`packages/mobile/src/state/sessionStore.tsx`) and are only packaged into the report schema upon patient consent.
- **Encryption in Transit:** All telemetry, calibration data, and session JSON files sent to the API must run exclusively over HTTPS.
