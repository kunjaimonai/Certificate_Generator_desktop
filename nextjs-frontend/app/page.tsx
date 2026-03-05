"use client";

import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../styles/Home.module.css';

interface FormData {
  certificate_no: string;
  name: string;
  license_no: string;
  from_date: string;
  to_date: string;
  issue_date: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  filename?: string;
}

interface ApiError {
  message: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    certificate_no: '',
    name: '',
    license_no: '',
    from_date: '',
    to_date: '',
    issue_date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDateForDisplay = (dateStr: string): string => {
    // Convert YYYY-MM-DD to DD-MM-YYYY for certificate
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Format dates for certificate display
      const certificateData = {
        certificate_no: formData.certificate_no,
        name: formData.name,
        license_no: formData.license_no,
        from_date: formatDateForDisplay(formData.from_date),
        to_date: formatDateForDisplay(formData.to_date),
        issue_date: formatDateForDisplay(formData.issue_date)
      };

      const response = await axios.post<ApiResponse>(
        'http://localhost:5000/api/generate',
        certificateData
      );
      
      if (response.data.success && response.data.filename) {
        setMessage('✓ Certificate generated successfully!');
        
        // Download the certificate
        const downloadResponse = await axios.get(
          `http://localhost:5000/api/download/${response.data.filename}`,
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        // Reset form after successful generation
        setTimeout(() => {
          setFormData({
            certificate_no: '',
            name: '',
            license_no: '',
            from_date: '',
            to_date: '',
            issue_date: new Date().toISOString().split('T')[0]
          });
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      const err = error as AxiosError<ApiError>;
      setMessage('✗ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Certificate Generator
        </h1>
        
        <p className={styles.description}>
          Hazardous Goods Driver Training Certificate
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="certificate_no">Certificate Number</label>
            <input
              type="text"
              id="certificate_no"
              name="certificate_no"
              value={formData.certificate_no}
              onChange={handleChange}
              required
              placeholder="Enter certificate number"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Candidate Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="license_no">Driving License Number</label>
            <input
              type="text"
              id="license_no"
              name="license_no"
              value={formData.license_no}
              onChange={handleChange}
              required
              placeholder="Enter license number"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="from_date">Training From Date</label>
              <input
                type="date"
                id="from_date"
                name="from_date"
                value={formData.from_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="to_date">Training To Date</label>
              <input
                type="date"
                id="to_date"
                name="to_date"
                value={formData.to_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="issue_date">Issue Date</label>
            <input
              type="date"
              id="issue_date"
              name="issue_date"
              value={formData.issue_date}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>
        </form>

        {message && (
          <div className={message.includes('Error') || message.includes('✗') ? styles.error : styles.success}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
}