# python-backend/certificate_generator.py
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
from datetime import datetime
import os

class CertificateGenerator:
    def __init__(self, template_path=None):
        self.template_path = template_path
        self.width, self.height = A4
        
    def create_overlay(self, data):
        """Create an overlay with the certificate data"""
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)
        
        # Set font
        c.setFont("Helvetica", 12)
        
        # Certificate Number
        if 'certificate_no' in data:
            c.drawString(180, 740, data['certificate_no'])
        
        # Name
        if 'name' in data:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(280, 615, data['name'])
        
        # License Number
        if 'license_no' in data:
            c.setFont("Helvetica", 12)
            c.drawString(280, 590)
            c.drawString(280, 590, data['license_no'])
        
        # Training dates
        if 'from_date' in data and 'to_date' in data:
            c.drawString(380, 565, data['from_date'])
            c.drawString(520, 565, data['to_date'])
        
        # Place and Date at bottom
        if 'issue_date' in data:
            c.drawString(250, 130, data['issue_date'])
        
        c.save()
        packet.seek(0)
        return packet
    
    def generate_certificate(self, data, output_path):
        """Generate certificate by overlaying data on template"""
        try:
            if self.template_path and os.path.exists(self.template_path):
                # Use existing template
                template_pdf = PdfReader(self.template_path)
                overlay_packet = self.create_overlay(data)
                overlay_pdf = PdfReader(overlay_packet)
                
                # Merge template with overlay
                writer = PdfWriter()
                page = template_pdf.pages[0]
                page.merge_page(overlay_pdf.pages[0])
                writer.add_page(page)
                
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
            else:
                # Create certificate from scratch
                c = canvas.Canvas(output_path, pagesize=A4)
                
                # Header
                c.setFont("Helvetica-Bold", 20)
                c.drawCentredString(self.width/2, 750, "SREE NARAYANA")
                c.setFont("Helvetica-Bold", 16)
                c.drawCentredString(self.width/2, 730, "HAZARDOUS GOODS DRIVER TRAINING INSTITUTE")
                
                c.setFont("Helvetica", 10)
                c.drawCentredString(self.width/2, 710, "KIZHAKKAMBALAM P.O., MUVATTUPUZHA")
                c.drawCentredString(self.width/2, 695, "ERNAKULAM DIST. KERALA, PIN:683562")
                c.drawCentredString(self.width/2, 680, f"PHONE: 9846199895, 8943424622")
                
                # Certificate title
                c.setFont("Helvetica-Bold", 24)
                c.drawCentredString(self.width/2, 640, "CERTIFICATE")
                
                # Certificate number
                c.setFont("Helvetica", 12)
                c.drawString(50, 610, f"No. {data.get('certificate_no', '................')}")
                
                # Body text
                c.setFont("Helvetica", 12)
                text = f"This is to certify that Sri. {data.get('name', '......................................')}"
                c.drawString(50, 580, text)
                
                text = f"holder of Driving License No. {data.get('license_no', '............................')}"
                c.drawString(50, 560, text)
                
                text = "has successfully passed the 3 days training course conducted from"
                c.drawString(50, 540, text)
                
                text = f"{data.get('from_date', '..................')} to {data.get('to_date', '..................')}"
                c.drawString(50, 520, text)
                
                text = "at the Sree Narayana Hazardous Goods Driver Training Institute,"
                c.drawString(50, 500, text)
                
                text = "Kizhakkambalam, Muvattupuzha for the drivers of vehicles carrying"
                c.drawString(50, 480, text)
                
                text = "dangerous/hazardous goods prescribed under Rule 9(1) of the CMV Rules 1989."
                c.drawString(50, 460, text)
                
                # Place and Date
                c.drawString(50, 180, f"Place: Kizhakkambalam")
                c.drawString(50, 160, f"Date: {data.get('issue_date', datetime.now().strftime('%d-%m-%Y'))}")
                
                # Director signature line
                c.drawRightString(self.width - 50, 180, "Director")
                
                # Footer
                c.setFont("Helvetica", 8)
                c.drawCentredString(self.width/2, 100, 
                    "Approved by Govt. of Kerala Vide G.O. (Rt) No. 379/2024/Trans Dated 24-09-2024")
                c.drawCentredString(self.width/2, 85, 
                    "License No. C2/5/2024/TC, Dated 30-12-2024, valid from 28-12-2024 to 27-12-2029")
                
                c.save()
            
            return True, "Certificate generated successfully"
        except Exception as e:
            return False, f"Error generating certificate: {str(e)}"


# python-backend/main.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from certificate_generator import CertificateGenerator
import os
import uuid

app = Flask(__name__)
CORS(app)

OUTPUT_DIR = "generated_certificates"
TEMPLATE_DIR = "templates"

# Create directories if they don't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMPLATE_DIR, exist_ok=True)

@app.route('/api/generate', methods=['POST'])
def generate_certificate():
    try:
        data = request.json
        
        # Generate unique filename
        filename = f"certificate_{uuid.uuid4().hex[:8]}.pdf"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        # Check for template
        template_path = None
        template_files = [f for f in os.listdir(TEMPLATE_DIR) if f.endswith('.pdf')]
        if template_files:
            template_path = os.path.join(TEMPLATE_DIR, template_files[0])
        
        # Generate certificate
        generator = CertificateGenerator(template_path)
        success, message = generator.generate_certificate(data, output_path)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'filename': filename,
                'path': output_path
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_certificate(filename):
    try:
        file_path = os.path.join(OUTPUT_DIR, filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, download_name=filename)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'certificate-generator'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)