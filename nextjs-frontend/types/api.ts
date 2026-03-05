export interface CertificateFormData {
  certificate_no: string;
  name: string;
  license_no: string;
  from_date: string;
  to_date: string;
  issue_date: string;
}

export interface GenerateCertificateResponse {
  success: boolean;
  message: string;
  filename?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
}