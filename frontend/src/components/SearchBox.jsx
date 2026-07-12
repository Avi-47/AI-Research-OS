import { useState } from "react";
import axios from "axios";
import Report from "./Report";

function SearchBox() {

    const [query, setQuery] = useState("");
    const [report, setReport] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSearch() {

        setLoading(true);

        try {

            const response =
                await axios.post(
                    "http://localhost:5000/api/research",
                    {
                        query
                    }
                );

            setReport(response.data.report);

        } catch(err) {
            console.error(err.message);
        }

        setLoading(false);
    }

    return (

        <div>

            <h1>
                AI Research OS
            </h1>

            <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Enter research topic"
            />

            <button
                onClick={handleSearch}
            >
                Research
            </button>

            {
                loading &&
                <p>Researching...</p>
            }

            <Report report={report}/>

        </div>
    );
}

export default SearchBox;