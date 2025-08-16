import { InformUser, GenerateTextFile, DraftEmail, GenerateReportPDF } from './ToolArtifacts'

export default function ToolRenderer({ tool, output }) {
  switch (tool) {
    case 'informUser':
      return <InformUser output={output} />
    case 'generateTextFile':
      return <GenerateTextFile output={output} />
    case 'draftEmail':
      return <DraftEmail output={output} />
    case 'generateReportPDF':
      return <GenerateReportPDF output={output} />
    default:
      return (
        <div className="border border-gray-200 rounded-lg p-3">
          <h3 className="text-sm font-medium">{tool}</h3>
          <pre className="text-xs bg-gray-50 p-2 rounded mt-1">{JSON.stringify(output, null, 2)}</pre>
        </div>
      )
  }
}
