# Cardboard Template Specification

This document defines the mathematical, geometrical, and structural requirements for the `hphvision` dynamic cardboard template generator. The generator outputs layout schemas used to print cardboard supports/visors adapted to a patient's smartphone dimensions to support the target near-testing distance.

---

## 1. Geometric Coordinate System & Units

To ensure cross-platform compatibility and physical rendering precision:

- **Primary Units:** All coordinates, widths, heights, and margins must be defined in **millimeters (mm)**.
- **Coordinate System:** 2D page coordinate system where the origin `(0, 0)` is located at the **top-left corner** of the page boundary.
  - $+x$ axes extend horizontally to the right.
  - $+y$ axes extend vertically downwards.
- **Precision:** Coordinates must be represented as float values to support precise component alignments.

---

## 2. Document & Page Configuration

The template generator supports two standard physical page sizes:

| Page Size Standard | Width (mm) | Height (mm) | Margin Boundaries                |
| :----------------- | :--------- | :---------- | :------------------------------- |
| **A4**             | $210.0$    | $297.0$     | $10.0 \text{ mm}$ minimum margin |
| **LETTER**         | $215.9$    | $279.4$     | $10.0 \text{ mm}$ minimum margin |

Each template document consists of one or more pages. Elements inside pages must not exceed the print boundaries defined by page dimensions minus margins to prevent clipping during printing.

---

## 3. Required Input Schemas

The generator expects two primary inputs (`TemplateInput`):

### 3.1 Phone Geometry (`PhoneGeometry`)

Physical dimensions extracted from the internal device database or manually calibrated by the user:

- `modelName`: Human-readable identifier (string).
- `bodyWidthMm`: Physical width of the phone chassis (number).
- `bodyHeightMm`: Physical height of the phone chassis (number).
- `thicknessMm`: Physical thickness of the phone chassis (number).

**Example `PhoneGeometry` Input:**

```json
{
  "modelName": "iPhone 15",
  "bodyWidthMm": 71.6,
  "bodyHeightMm": 147.6,
  "thicknessMm": 7.8
}
```

### 3.2 Template Options (`TemplateOptions`)

User preferences configured at execution time:

- `pageSize`: Either `'A4'` or `'LETTER'`.
- `cardboardThicknessMm`: Thickness of the material used for the visor construction (used to compensate for fold gaps).
- `eyeToScreenDistanceMm`: Calculated target vertex distance.
- `includeAssemblyInstructions`: Toggle to output step-by-step guides.

---

## 4. Validation Constraints

The generator performs automated validation checks before compiling template layouts. The validation rules are coded in `packages/mobile-lib/src/template-generator/validation.ts`:

### 4.1 Phone Dimension Constraints

- **Phone Width (`bodyWidthMm`):** Must fall within range $[40.0\text{ mm}, 120.0\text{ mm}]$.
- **Phone Height (`bodyHeightMm`):** Must fall within range $[80.0\text{ mm}, 230.0\text{ mm}]$.
- **Phone Thickness (`thicknessMm`):** Must fall within range $[3.0\text{ mm}, 25.0\text{ mm}]$.
- **Model Name:** Must not be empty or whitespace.

### 4.2 Option Constraints

- **Cardboard Thickness:** Must fall within range $[0.5\text{ mm}, 8.0\text{ mm}]$.
- **Eye-to-Screen Distance:** Must fall within range $[80.0\text{ mm}, 600.0\text{ mm}]$.
- **Page Size:** Must match exactly `'A4'` or `'LETTER'`.

---

## 5. Structural Template Components

The generated page contains elements categorized by physical behaviors/roles. Elements are drawn using line segments, rectangles, or text strings:

| Element ID                | Geometry   | Role          | Purpose / Assembly Behavior                                                         |
| :------------------------ | :--------- | :------------ | :---------------------------------------------------------------------------------- |
| `visor-outer-cut`         | `RectPath` | `cut`         | Outer boundary cutout representing the main visor framework.                        |
| `phone-fit-outline`       | `RectPath` | `guide`       | Alignment boundary representing the physical outline of the phone.                  |
| `phone-holder-slot`       | `RectPath` | `slot`        | Internal slot cutout where the smartphone sits.                                     |
| `eye-window-cut`          | `RectPath` | `cut`         | Viewer aperture aligned for optical path validation.                                |
| `nose-cutout-guide`       | `RectPath` | `guide`       | Reference cutout line matching user nose alignment.                                 |
| `occlusion-flap-cut`      | `RectPath` | `cut`         | Flap cutout to manually occlude the left/right eye during monocular trials.         |
| `left-glue-tab`           | `RectPath` | `glue`        | Highlighted region for applying adhesive tape/glue during assembly.                 |
| `right-glue-tab`          | `RectPath` | `glue`        | Highlighted region for applying adhesive tape/glue during assembly.                 |
| `top-fold-line`           | `LinePath` | `fold`        | Dash/score fold line representing upper visor pivot fold.                           |
| `bottom-fold-line`        | `LinePath` | `fold`        | Dash/score fold line representing lower visor pivot fold.                           |
| `scale-check-square-50mm` | `RectPath` | `calibration` | $50\text{ mm} \times 50\text{ mm}$ square block for physical printing verification. |
| `calibration-ruler`       | `LinePath` | `calibration` | A $50\text{ mm}$ visual reference scale line.                                       |

---

## 6. Print-Scale Verification & Quality Check

To prevent printer scaling options (such as "Fit to Page" or "Shrink to Fit") from corrupting the physical vertex distance:

1. **Calibration Check Block:** The generator draws a square with exact geometry parameters:
   - Width: $50.0 \text{ mm}$
   - Height: $50.0 \text{ mm}$
2. **User Check Rule:** Before slicing or folding cardboard, the user must measure the printed square with a standard metric ruler. If the physical printout measures anything other than $50.0 \text{ mm} \pm 0.5 \text{ mm}$, the page must be reprinted at $100\%$ scale.

---

## 7. Assembly Instructions Workflow

When `includeAssemblyInstructions` is set to `true`, the layout outputs the following sequential steps:

1. **Step 1 (Print Scale):** Print at 100% scale. Do not fit to page.
2. **Step 2 (Confirm Calibration):** Measure the calibration square and confirm it is exactly 50 mm.
3. **Step 3 (Slicing):** Cut only on solid cut lines (`role: 'cut'`) and keep fold lines intact.
4. **Step 4 (Folding):** Fold tabs along fold lines (`role: 'fold'`) and glue/tape where marked (`role: 'glue'`).
5. **Step 5 (Mounting):** Insert the phone and confirm it fits snugly without tilting.

---

## 8. Technical Design Limitations

Contributors modifying the `template-generator` package must note:

- **Cardboard Compression Gaps:** The geometry equations assume thin cardboard. Material thickness $>3.0\text{ mm}$ requires adding fold gaps to prevent buckling.
- **Flat Surface Calibration:** Curved smartphone backs (e.g., dome shapes) may sit unevenly in the phone holder, introducing angular offsets.
- **Optics Alignment:** The design assumes symmetrical pupillary distance (PD) centered on the screen axis. High-asymmetry PD users may face clipping at the edge of the eye windows.

---

## 9. Example Layout Configuration Payload (JSON)

An example generated `TemplateDocument` JSON schema:

```json
{
  "pages": [
    {
      "id": "page-1",
      "pageSize": "LETTER",
      "widthMm": 215.9,
      "heightMm": 279.4,
      "elements": [
        {
          "kind": "text",
          "id": "title",
          "origin": {"xMm": 10, "yMm": 14},
          "textKey": "template.title",
          "fallbackText": "hphvision cardboard template for iPhone 15",
          "sizeMm": 4,
          "role": "label"
        },
        {
          "kind": "rect",
          "id": "scale-check-square-50mm",
          "origin": {"xMm": 10, "yMm": 211.4},
          "widthMm": 50,
          "heightMm": 50,
          "role": "calibration"
        }
      ]
    }
  ],
  "calibrationMarks": [
    {
      "id": "scale-check-square-50mm",
      "kind": "square",
      "expectedSizeMm": 50,
      "pageId": "page-1",
      "elementId": "scale-check-square-50mm"
    }
  ],
  "instructions": [
    {
      "id": "print-scale",
      "step": 1,
      "textKey": "template.instructions.printScale",
      "fallbackText": "Print at 100% scale. Do not fit to page."
    }
  ],
  "metadata": {
    "templateVersion": "template-v0.1",
    "generatedForModel": "iPhone 15",
    "pageSize": "LETTER",
    "phoneBodyWidthMm": 71.6,
    "phoneBodyHeightMm": 147.6,
    "phoneThicknessMm": 7.8,
    "cardboardThicknessMm": 1.5,
    "eyeToScreenDistanceMm": 400
  }
}
```
