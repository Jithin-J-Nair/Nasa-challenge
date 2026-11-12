# Moon catalogue counting method

Source: NASA History Program, [*Catalogue of Manmade Material on the Moon* (2012)](https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf).

Silent Fleet does **not** present an aggregate Moon mass. The PDF is a catalogue, not a NASA mass accounting, and its rows mix individual objects, containers, experiments, aggregate assemblies, unknown locations, and quantity annotations.

## Defensible displayed count

The site displays **22 U.S. non-Apollo object/location rows**. This is the count of the first top-level table headed **“U.S. Material (Non-Apollo)”**. It is intentionally a labelled table count, not a count of every human-made object on the Moon.

| method | count | treatment |
| --- | ---: | --- |
| Top-level lines in the U.S. non-Apollo table | 22 | One row per printed object/location row, including rows whose location is `UNKNOWN` or `Crashed`. |
| Lines excluding “(see below)” and nested sub-items | 22 | The displayed table has no “see below” or nested sub-item lines, so the count remains 22. |
| Sum of bracketed quantities | Not reported | Bracketed quantities appear throughout other tables, but summing them would mix sub-items and assemblies and would double-count material. NASA does not provide a single aggregate quantity or mass in the source. |

## Location handling

The browsable list transcribes the NASA table’s location field without supplying missing coordinates; `UNKNOWN` and `Crashed` remain non-coordinate values. Direction labels only make the table’s signed values readable. The Ranger 9 value is marked as rendered by the accessible PDF parser rather than silently normalized. Silent Fleet does not invent locations for rows where NASA does not provide one.
