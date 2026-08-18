# RENTipid Archive Contents and Status

Archive path:
`docs/final-documentation/13-ARCHIVE/RENTipid_COMPLETE_DOCUMENTATION_PACKAGE.zip`

Archive tooling:
PowerShell with local .NET `System.IO.Compression.ZipArchive` and
`CreateEntryFromFile`.

Included:

- canonical document control and master manual;
- canonical separate manuals and training guide;
- 18-registry evidence layer and canonical registry index;
- 25 Mermaid sources, 25 SVG renders, 25 PNG renders, and diagram catalog;
- generated master DOCX and PDF plus supporting historical HTML and retained
  rendering script;
- evidence, reconciliation, validation, and hash records;
- rendering-status record;
- preliminary manuals retained for traceability;
- final documentation index and freeze manifest.

Excluded:

- the archive ZIP itself, preventing recursive archive inclusion; the archive
  contents record remains included as a normal documentation entry;
- application source, tests, Prisma, infrastructure, workflows, and Git data;
- `node_modules`, databases, environment-value files, temporary files, and
  any material outside `docs/final-documentation/`;

All requested rendered formats are included.

`ARCHIVE_STATUS: GENERATED_WITH_LOCAL_POWERSHELL_DOTNET_ZIPARCHIVE`
