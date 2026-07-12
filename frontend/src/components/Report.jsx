import ReactMarkdown from "react-markdown";

function Report({ report }) {
  return (
    <div>
      <ReactMarkdown>
        {report}
      </ReactMarkdown>
    </div>
  );
}

export default Report;