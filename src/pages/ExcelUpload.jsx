import { useState } from "react";
import ExcelJS from "exceljs";
import { supabase } from "../lib/supabase";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Confetti from "../components/Confetti";
import "../Styles/admin.css";

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    try {
      if (!file) {
        alert("Please select an Excel file");
        return;
      }
      setLoading(true);

      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        alert("No worksheet found in this Excel file");
        return;
      }

      const header1 = String(worksheet.getCell("A1").value || "").trim();
      const header2 = String(worksheet.getCell("B1").value || "").trim();
      const header3 = String(worksheet.getCell("C1").value || "").trim();

      if (
        header1 !== "student_id" ||
        header2 !== "student_name" ||
        header3 !== "degree"
      ) {
        alert(
          "Invalid Excel file. The columns must be: student_id, student_name, degree",
        );
        return;
      }

      const students = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const serialNum = row.getCell(1).value;
        const name = row.getCell(2).value;
        const degree = row.getCell(3).value;
        if (serialNum && name) {
          students.push({
            student_id: String(serialNum).trim(),
            student_name: String(name).trim(),
            degree: degree ? String(degree).trim() : null,
          });
        }
      });

      if (students.length === 0) {
        alert("No students found in the Excel file");
        return;
      }

      const { error } = await supabase
        .from("students")
        .upsert(students, { onConflict: "student_id" });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      alert(`Students uploaded successfully: ${students.length}`);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-shell">
      <Sidebar />

      <main className="adm-main">
        <header className="adm-header">
          <div>
            <h1>Excel Sheet</h1>
            <p>Import the graduate list from an Excel file</p>
          </div>
        </header>

        <div className="adm-body">
          <Confetti count={18} />
          <div className="adm-upload">
            <div className="adm-drop">
              <div className="ic">
                <FileSpreadsheet size={30} />
              </div>
              <h3>{file ? file.name : "Upload your graduate list"}</h3>
              <p>Accepted format: .xlsx / .xls</p>

              <label
                className="ksu-btn ksu-btn-ghost"
                style={{
                  width: "auto",
                  display: "inline-flex",
                  cursor: "pointer",
                }}
              >
                <UploadCloud size={18} /> Choose file
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
              </label>

              {file && (
                <div className="adm-file">
                  Selected: <strong>{file.name}</strong>
                </div>
              )}
            </div>

            <button
              className="ksu-btn ksu-btn-primary"
              style={{ marginTop: 22 }}
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Uploading…" : "Upload to database"}
            </button>

            <div className="adm-hint">
              The first row must have these exact column headers:&nbsp;
              <code>student_id</code> <code>student_name</code>{" "}
              <code>degree</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
