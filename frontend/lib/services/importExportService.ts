import { apiDownloadBlob } from "../api";

export async function downloadCrmTemplateExcel(): Promise<void> {
  const blob = await apiDownloadBlob("/data/crm-template", {
    method: "GET",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `rising_crm_master_template_${new Date().getTime()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
