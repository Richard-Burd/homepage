I have a **Nivo pie/donut chart** whose outside arc-link labels need to fit within the width of their parent container.

I will give you:

1. A screenshot of the current chart.
2. The category labels.
3. Each category's percentage/value.
4. The current `pieOrder` and slice data.

Your job is to **rearrange the slice order to maximize label fit and minimize the chance that any labels are clipped, overlap, or extend outside the parent div.**

### Optimization priorities

Analyze the **actual geometry of the pie**, not merely the order of the data.

When choosing the order:

- Put the **longest labels near the top or bottom** of the pie, where their leader lines can point more vertically and therefore consume less horizontal space.
- Prefer **short labels near the far-left and far-right positions**, where labels extend most horizontally and are most likely to hit the container boundaries.
- Account for each slice's **percentage/angle**, because changing the order changes the midpoint angle at which every label is anchored.
- Consider both the **left and right sides independently**. Balance the amount of horizontal label space required on each side.
- Avoid placing multiple long labels next to each other if doing so is likely to create vertical collisions.
- Use the screenshot to identify which labels are currently closest to or beyond the parent boundaries.
- Optimize primarily for **horizontal fit**, but also avoid obvious vertical label collisions.
- Assume Nivo's normal arc-link-label behavior: a label originates around the midpoint angle of its slice and extends outward from the donut.
- Do **not** change category values, percentages, IDs, colors, wording, or any other data unless I specifically ask you to.
- Do **not** simply sort by label length or percentage. Find a good **geometric arrangement of slices**.

### Important

Treat this as a small combinatorial layout-optimization problem.

If there are relatively few categories, mentally compare multiple possible arrangements rather than making a superficial guess. The goal is:

**Minimize the maximum horizontal extent of all outside labels within the available chart width.**

Pay special attention to labels whose slice midpoint is near:

- **3 o'clock** → highest risk on the right
- **9 o'clock** → highest risk on the left

Those positions should generally be occupied by shorter labels.

Long labels are generally preferable near:

- **12 o'clock**
- **6 o'clock**

because their horizontal displacement from the pie is smaller.

### Output

First, give me the recommended `pieOrder` in directly usable JSON:

```json
"pieOrder": [
  "CategoryX",
  "CategoryY",
  "CategoryZ"
]
```

Then show the resulting clockwise order as:

```text
Category label — percentage
Category label — percentage
...
```

Finally, give me a **very short explanation** of why the arrangement is better, identifying which long labels you moved away from dangerous horizontal positions.

Do not recommend increasing margins, shrinking the font, wrapping labels, changing the parent width, or changing Nivo settings unless **no reasonable ordering can solve the problem**. First optimize the slice ordering using the existing chart dimensions.

Here is my current chart data and screenshot:

[PASTE DATA HERE]

[ATTACH SCREENSHOT]
