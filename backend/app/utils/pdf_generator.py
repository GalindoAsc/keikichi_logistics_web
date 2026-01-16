from datetime import datetime
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Optional, Dict
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.config import settings


# ============================================================================
# KEIKICHI PDF DESIGN SYSTEM - PRINT-FRIENDLY PREMIUM THEME
# ============================================================================

# Color Palette - Print-friendly with dark text and cyan accents (from logo)
class Colors:
    # Backgrounds (light for printing)
    BG_WHITE = colors.white
    BG_LIGHT = colors.HexColor('#f8f9fa')      # Very light gray
    BG_SECTION = colors.HexColor('#f1f3f5')    # Light gray for sections
    
    # Keikichi brand colors (from logo - blue/cyan tones)
    BRAND_PRIMARY = colors.HexColor('#00a8cc')   # Cyan/Teal - main accent
    BRAND_SECONDARY = colors.HexColor('#0077b6') # Deep blue
    BRAND_LIGHT = colors.HexColor('#e3fafc')     # Very light cyan (for backgrounds)
    
    # Text colors (dark for readability)
    TEXT_BLACK = colors.HexColor('#212529')    # Almost black
    TEXT_DARK = colors.HexColor('#343a40')     # Dark gray
    TEXT_MUTED = colors.HexColor('#6c757d')    # Medium gray
    TEXT_LIGHT = colors.HexColor('#adb5bd')    # Light gray
    
    # Status colors
    SUCCESS = colors.HexColor('#10b981')       # Emerald - Confirmed
    SUCCESS_BG = colors.HexColor('#d1fae5')    # Light green background
    WARNING = colors.HexColor('#f59e0b')       # Amber - Pending  
    WARNING_BG = colors.HexColor('#fef3c7')    # Light amber background
    DANGER = colors.HexColor('#ef4444')        # Red - Urgent
    
    # Borders and dividers
    BORDER = colors.HexColor('#dee2e6')
    BORDER_DARK = colors.HexColor('#adb5bd')
    
    WHITE = colors.white
    BLACK = colors.HexColor('#000000')


# Default PDF settings (used if not configured in database)
DEFAULT_PDF_CONFIG = {
    "company_name": "Keikichi Logistics",
    "company_address": "México - Estados Unidos",
    "company_phone": "+52 123 456 7890",
    "company_email": "contacto@keikichi.com",
    "company_website": "www.keikichi.com",
    "pdf_footer_text": "Gracias por confiar en Keikichi Logistics",
    "terms_and_conditions": """• Este ticket es válido únicamente para los espacios indicados.
• La carga debe entregarse con al menos 2 horas de anticipación.
• No nos responsabilizamos por mercancía frágil sin embalaje adecuado.
• Cancelaciones: mínimo 24 horas de anticipación.
• Presenta este ticket al entregar tu carga.""",
    "payment_instructions": """1. Transfiere el monto exacto indicado.
2. Envía tu comprobante por la plataforma o WhatsApp.
3. Confirmación en máximo 2 horas.
4. Recibirás tu ticket por email.""",
    "whatsapp_number": "",
}


def get_pdf_config(db_configs: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """Get PDF configuration, merging database values with defaults."""
    config = DEFAULT_PDF_CONFIG.copy()
    if db_configs:
        # Update with all keys from db_configs, ensuring new keys are included
        for key, value in db_configs.items():
            config[key] = value
    return config


def generate_qr_code(data: str, box_size: int = 10, dark_mode: bool = False) -> BytesIO:
    """Generate QR code image with customizable size and colors."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # QR code colors - always dark on white for scannability
    img = qr.make_image(fill_color="#1a1a1a", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


def generate_reservation_ticket(
    reservation_id: str,
    client_name: str,
    client_email: str,
    trip_origin: str,
    trip_destination: str,
    departure_date: str,
    departure_time: Optional[str],
    space_numbers: list[int],
    subtotal: Decimal,
    tax_amount: Decimal,
    total_amount: Decimal,
    payment_method: str,
    cargo_description: Optional[str] = None,
    requires_invoice: bool = False,
    pdf_config: Optional[Dict[str, str]] = None,
    currency: str = "USD",
    exchange_rate: float = 1.0
) -> str:
    """
    Generate professional reservation ticket PDF.
    Returns the path to the generated file relative to upload_dir.
    """
    tickets_dir = Path(settings.upload_dir) / 'tickets'
    tickets_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"ticket_{reservation_id}.pdf"
    file_path = tickets_dir / filename
    
    # Setup document
    doc = SimpleDocTemplate(
        str(file_path), 
        pagesize=letter,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    elements = []
    config = get_pdf_config(pdf_config)
    
    # Currency setup
    currency_symbol = "$" if currency in ["USD", "MXN"] else currency
    
    # Header with Logo
    logo_path = Path(__file__).parent.parent / 'static' / 'keikichi_logo.jpg'
    
    # ... (skipping unchanged parts for brevity if possible, but replace_file_content needs contiguous block)
    # Since I cannot skip, I'll focus on the target functions.
    # The user asked to fix generate_pre_reservation_summary mostly.
    # I will split this into two edits if needed, or replace a larger chunk.
    # Given the distance, I should use multi_replace_file_content or just target the specific blocks.
    # I'll use multi_replace_file_content as the functions are far apart (get_pdf_config is line 77, generate_pre_reservation_summary logic is line 500).
    pass 
    
    # WAIT - I cannot put 'pass' here. I need to cancel this tool call and use multi_replace_file_content.
    # The previous prompt structure led me to think I was in single replace.
    # I will cancel this tool call by returning an empty string or just switching strategy.
    # Actually, I'll just use the correct tool.



def generate_qr_code(data: str, box_size: int = 10, dark_mode: bool = False) -> BytesIO:
    """Generate QR code image with customizable size and colors."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # QR code colors - always dark on white for scannability
    img = qr.make_image(fill_color="#1a1a1a", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer


def generate_reservation_ticket(
    reservation_id: str,
    client_name: str,
    client_email: str,
    trip_origin: str,
    trip_destination: str,
    departure_date: str,
    departure_time: Optional[str],
    space_numbers: list[int],
    subtotal: Decimal,
    tax_amount: Decimal,
    total_amount: Decimal,
    payment_method: str,
    cargo_description: Optional[str] = None,
    requires_invoice: bool = False,
    pdf_config: Optional[Dict[str, str]] = None,
    currency: str = "USD",
    exchange_rate: float = 1.0
) -> str:
    """
    Generate clean, compact confirmation ticket PDF.
    Single page design with clear hierarchy.
    """
    tickets_dir = Path(settings.upload_dir) / 'tickets'
    tickets_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"ticket_{reservation_id}.pdf"
    file_path = tickets_dir / filename
    
    doc = SimpleDocTemplate(
        str(file_path), 
        pagesize=letter,
        leftMargin=0.4*inch,
        rightMargin=0.4*inch,
        topMargin=0.3*inch,
        bottomMargin=0.3*inch
    )
    elements = []
    config = get_pdf_config(pdf_config)
    
    # Currency
    currency_symbol = "$" if currency in ["USD", "MXN"] else currency
    
    # =========== HEADER ===========
    logo_path = Path(__file__).parent.parent / 'static' / 'keikichi_logo.jpg'
    
    if logo_path.exists():
        logo = Image(str(logo_path), width=1.4*inch, height=0.56*inch)
    else:
        logo = Paragraph(f"<b>{config['company_name']}</b>", ParagraphStyle('Logo', fontSize=14, textColor=Colors.BRAND_SECONDARY))
    
    title = Paragraph(
        "<b>TICKET DE CONFIRMACION</b>",
        ParagraphStyle('Title', fontSize=16, textColor=Colors.BRAND_SECONDARY, alignment=TA_RIGHT)
    )
    
    header = Table([[logo, title]], colWidths=[3.5*inch, 4*inch])
    header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 2, Colors.BRAND_PRIMARY),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 6))
    
    # Status + QR row
    qr_buffer = generate_qr_code(reservation_id, box_size=6)
    qr_img = Image(qr_buffer, width=0.9*inch, height=0.9*inch)
    
    status_text = Paragraph(
        f"<font color='#10b981'><b>CONFIRMADO</b></font><br/>"
        f"<font size='8' color='#6c757d'>{datetime.now().strftime('%d/%m/%Y %H:%M')}</font>",
        ParagraphStyle('Status', fontSize=11, leading=14)
    )
    
    contact_text = Paragraph(
        f"<font size='7' color='#6c757d'>{config['company_phone']} | {config['company_email']}</font>",
        ParagraphStyle('Contact', fontSize=7)
    )
    
    status_row = Table([[status_text, contact_text, qr_img]], colWidths=[2.5*inch, 3.5*inch, 1.5*inch])
    status_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(status_row)
    elements.append(Spacer(1, 8))
    
    # =========== ROUTE (prominent) ===========
    departure_str = f"{departure_date}"
    if departure_time:
        departure_str += f" - {departure_time}"
    
    route_text = Paragraph(
        f"<font size='9' color='#0077b6'>RUTA</font><br/>"
        f"<font size='16' color='#212529'><b>{trip_origin}</b></font> "
        f"<font size='12' color='#00a8cc'>→</font> "
        f"<font size='16' color='#212529'><b>{trip_destination}</b></font>",
        ParagraphStyle('Route', fontSize=16, leading=20)
    )
    
    route_box = Table([[route_text]], colWidths=[7.5*inch])
    route_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(route_box)
    elements.append(Spacer(1, 8))
    
    # =========== INFO TABLE ===========
    info_style = ParagraphStyle('Info', fontSize=9, leading=12)
    label_style = ParagraphStyle('Label', fontSize=8, textColor=Colors.TEXT_MUTED)
    
    info_data = [
        [Paragraph("Cliente", label_style), Paragraph(f"<b>{client_name}</b>", info_style),
         Paragraph("Espacios", label_style), Paragraph(f"<b>{', '.join(map(str, sorted(space_numbers)))}</b> ({len(space_numbers)})", info_style)],
        [Paragraph("Email", label_style), Paragraph(client_email, info_style),
         Paragraph("Salida", label_style), Paragraph(f"<b>{departure_str}</b>", info_style)],
        [Paragraph("ID", label_style), Paragraph(reservation_id[:16], info_style),
         Paragraph("Metodo", label_style), Paragraph(payment_method, info_style)],
    ]
    
    info_table = Table(info_data, colWidths=[0.8*inch, 2.7*inch, 0.8*inch, 3.2*inch])
    info_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(info_table)
    
    # Cargo (if present)
    if cargo_description:
        elements.append(Spacer(1, 4))
        cargo_para = Paragraph(
            f"<font size='8' color='#6c757d'>Carga:</font> <font size='9'>{cargo_description[:100]}</font>",
            info_style
        )
        elements.append(cargo_para)
    
    elements.append(Spacer(1, 10))
    
    # =========== PAYMENT ===========
    mxn_note = ""
    if currency == "USD" and exchange_rate > 1:
        mxn_note = f" (~${float(total_amount) * exchange_rate:,.0f} MXN)"
    
    payment_data = [
        [Paragraph("Subtotal", label_style), Paragraph(f"{currency_symbol}{subtotal:,.2f}", info_style)],
        [Paragraph("Impuestos", label_style), Paragraph(f"{currency_symbol}{tax_amount:,.2f}", info_style)],
    ]
    
    payment_left = Table(payment_data, colWidths=[1*inch, 1.5*inch])
    payment_left.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    
    total_para = Paragraph(
        f"<font size='14' color='#10b981'><b>TOTAL: {currency_symbol}{total_amount:,.2f} {currency}</b></font>{mxn_note}<br/>"
        f"<font size='9' color='#10b981'>PAGADO</font>",
        ParagraphStyle('Total', fontSize=14, alignment=TA_CENTER, leading=18)
    )
    
    total_box = Table([[total_para]], colWidths=[4*inch])
    total_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.SUCCESS_BG),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    
    payment_row = Table([[payment_left, total_box]], colWidths=[3*inch, 4.5*inch])
    payment_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(payment_row)
    elements.append(Spacer(1, 10))
    
    # =========== TERMS ===========
    terms = config.get('terms_and_conditions', '')
    terms_compact = ' '.join(terms.replace('\n', ' ').replace('•', '-').split())[:300]
    if requires_invoice:
        terms_compact += " Factura: 48 hrs."
    
    terms_para = Paragraph(
        f"<font size='6' color='#adb5bd'>{terms_compact}</font>",
        ParagraphStyle('Terms', fontSize=6, leading=8)
    )
    elements.append(terms_para)
    elements.append(Spacer(1, 6))
    
    # =========== FOOTER ===========
    footer = Paragraph(
        f"<font size='7' color='#0077b6'>{config['pdf_footer_text']}</font> | "
        f"<font size='6' color='#adb5bd'>{config['company_website']}</font>",
        ParagraphStyle('Footer', fontSize=7, alignment=TA_CENTER)
    )
    elements.append(footer)
    
    doc.build(elements)
    return f"tickets/{filename}"
    

def delete_ticket(reservation_id: str) -> bool:
    """
    Delete ticket PDF for a reservation
    
    Args:
        reservation_id: ID of the reservation
    
    Returns:
        True if deleted, False otherwise
    """
    filename = f"ticket_{reservation_id}.pdf"
    file_path = Path(settings.upload_dir) / 'tickets' / filename

    
    if file_path.exists():
        try:
            file_path.unlink()
            return True
        except Exception:
            return False
    
    return False


def generate_pre_reservation_summary(
    reservation_id: str,
    client_name: str,
    client_email: str,
    trip_origin: str,
    trip_destination: str,
    departure_date: str,
    departure_time: Optional[str],
    space_numbers: list[int],
    subtotal: Decimal,
    tax_amount: Decimal,
    total_amount: Decimal,
    payment_method: str,
    payment_deadline_hours: int = 24,
    bank_details_invoice: Optional[str] = None,
    bank_details_no_invoice: Optional[str] = None,
    requires_invoice: bool = False,
    pdf_config: Optional[Dict[str, str]] = None,
    currency: str = "USD",
    exchange_rate: float = 1.0
) -> str:
    """
    Generate clean, compact pre-reservation summary PDF.
    Single page design matching ticket style.
    """
    summaries_dir = Path(settings.upload_dir) / 'summaries'
    summaries_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"summary_{reservation_id}.pdf"
    file_path = summaries_dir / filename
    
    doc = SimpleDocTemplate(
        str(file_path), 
        pagesize=letter,
        leftMargin=0.4*inch,
        rightMargin=0.4*inch,
        topMargin=0.3*inch,
        bottomMargin=0.3*inch
    )
    elements = []
    config = get_pdf_config(pdf_config)
    
    # Currency
    currency_symbol = "$" if currency in ["USD", "MXN"] else currency
    
    # =========== HEADER ===========
    logo_path = Path(__file__).parent.parent / 'static' / 'keikichi_logo.jpg'
    
    if logo_path.exists():
        logo = Image(str(logo_path), width=1.4*inch, height=0.56*inch)
    else:
        logo = Paragraph(f"<b>{config['company_name']}</b>", ParagraphStyle('Logo', fontSize=14, textColor=Colors.BRAND_SECONDARY))
    
    title = Paragraph(
        "<b>RESUMEN DE PRE-RESERVACION</b>",
        ParagraphStyle('Title', fontSize=16, textColor=Colors.WARNING, alignment=TA_RIGHT)
    )
    
    header = Table([[logo, title]], colWidths=[3.5*inch, 4*inch])
    header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 2, Colors.WARNING),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 6))
    
    # Status + QR row
    qr_buffer = generate_qr_code(reservation_id, box_size=6)
    qr_img = Image(qr_buffer, width=0.9*inch, height=0.9*inch)
    
    status_text = Paragraph(
        f"<font color='#f59e0b'><b>PENDIENTE DE PAGO</b></font><br/>"
        f"<font size='8' color='#6c757d'>{datetime.now().strftime('%d/%m/%Y %H:%M')}</font>",
        ParagraphStyle('Status', fontSize=11, leading=14)
    )
    
    contact_text = Paragraph(
        f"<font size='7' color='#6c757d'>{config['company_phone']} | {config['company_email']}</font>",
        ParagraphStyle('Contact', fontSize=7)
    )
    
    status_row = Table([[status_text, contact_text, qr_img]], colWidths=[2.5*inch, 3.5*inch, 1.5*inch])
    status_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(status_row)
    elements.append(Spacer(1, 8))
    
    # =========== ROUTE ===========
    departure_str = f"{departure_date}"
    if departure_time:
        departure_str += f" - {departure_time}"
    
    route_text = Paragraph(
        f"<font size='9' color='#0077b6'>RUTA</font><br/>"
        f"<font size='16' color='#212529'><b>{trip_origin}</b></font> "
        f"<font size='12' color='#00a8cc'>→</font> "
        f"<font size='16' color='#212529'><b>{trip_destination}</b></font>",
        ParagraphStyle('Route', fontSize=16, leading=20)
    )
    
    route_box = Table([[route_text]], colWidths=[7.5*inch])
    route_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(route_box)
    elements.append(Spacer(1, 8))
    
    # =========== INFO ===========
    info_style = ParagraphStyle('Info', fontSize=9, leading=12)
    label_style = ParagraphStyle('Label', fontSize=8, textColor=Colors.TEXT_MUTED)
    
    info_data = [
        [Paragraph("Cliente", label_style), Paragraph(f"<b>{client_name}</b>", info_style),
         Paragraph("Espacios", label_style), Paragraph(f"<b>{', '.join(map(str, sorted(space_numbers)))}</b> ({len(space_numbers)})", info_style)],
        [Paragraph("Email", label_style), Paragraph(client_email, info_style),
         Paragraph("Salida", label_style), Paragraph(f"<b>{departure_str}</b>", info_style)],
        [Paragraph("ID", label_style), Paragraph(reservation_id[:16], info_style),
         Paragraph("Metodo", label_style), Paragraph(payment_method, info_style)],
    ]
    
    info_table = Table(info_data, colWidths=[0.8*inch, 2.7*inch, 0.8*inch, 3.2*inch])
    info_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))
    
    # =========== PAYMENT ===========
    mxn_note = ""
    if currency == "USD" and exchange_rate > 1:
        mxn_note = f" (~${float(total_amount) * exchange_rate:,.0f} MXN)"
    
    payment_data = [
        [Paragraph("Subtotal", label_style), Paragraph(f"{currency_symbol}{subtotal:,.2f}", info_style)],
        [Paragraph("Impuestos", label_style), Paragraph(f"{currency_symbol}{tax_amount:,.2f}", info_style)],
    ]
    
    payment_left = Table(payment_data, colWidths=[1*inch, 1.5*inch])
    payment_left.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    
    total_para = Paragraph(
        f"<font size='14' color='#f59e0b'><b>TOTAL: {currency_symbol}{total_amount:,.2f} {currency}</b></font>{mxn_note}<br/>"
        f"<font size='9' color='#f59e0b'>PENDIENTE</font>",
        ParagraphStyle('TotalSummary', fontSize=14, alignment=TA_CENTER, leading=18)
    )
    
    total_box = Table([[total_para]], colWidths=[4*inch])
    total_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.WARNING_BG),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    
    payment_row = Table([[payment_left, total_box]], colWidths=[3*inch, 4.5*inch])
    payment_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(payment_row)
    elements.append(Spacer(1, 10))
    
    # =========== INSTRUCTIONS ===========
    payment_method_lower = payment_method.lower()
    is_cash = 'efectivo' in payment_method_lower or 'cash' in payment_method_lower
    is_mercadopago = 'mercadopago' in payment_method_lower or 'mercado' in payment_method_lower
    
    if is_cash:
        if config.get('payment_instructions_cash'):
            instr_text = f"<b>PAGO EN EFECTIVO</b><br/>{config['payment_instructions_cash'].replace(chr(10), '<br/>')}"
        else:
             instr_text = "<b>PAGO EN EFECTIVO</b><br/>Presente este resumen en bodega. Pago exacto."
        bg_color = Colors.SUCCESS_BG
    elif is_mercadopago:
        if config.get('payment_instructions_mercadopago'):
            instr_text = f"<b>MERCADOPAGO</b><br/>{config['payment_instructions_mercadopago'].replace(chr(10), '<br/>')}"
        else:
            instr_text = "<b>MERCADOPAGO</b><br/>Use el enlace enviado a su correo para pagar."
        bg_color = Colors.BRAND_LIGHT
    else:
        # Transfer - Prioritize specific transfer instructions if available
        if config.get('payment_instructions_transfer'):
             instr_text = f"<b>TRANSFERENCIA</b><br/>{config['payment_instructions_transfer'].replace(chr(10), '<br/>')}"
        else:
            bank_info = bank_details_invoice if requires_invoice else bank_details_no_invoice
            bank_compact = bank_info.replace('\n', ' | ') if bank_info else "Contacte a soporte."
            instr_text = f"<b>TRANSFERENCIA</b><br/>{bank_compact}"
        bg_color = Colors.BG_SECTION
    
    instr_para = Paragraph(f"<font size='8'>{instr_text}</font>", ParagraphStyle('Instr', fontSize=8, leading=10))
    instr_box = Table([[instr_para]], colWidths=[7.5*inch])
    instr_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(instr_box)
    
    # Deadline warning
    deadline_text = Paragraph(
        f"<font size='9' color='#ef4444'><b> IMPORTANTE: Tienes {payment_deadline_hours} horas para realizar el pago.</b></font>",
        ParagraphStyle('Deadline', fontSize=9, alignment=TA_CENTER)
    )
    elements.append(Spacer(1, 6))
    elements.append(deadline_text)
    
    elements.append(Spacer(1, 6))
    
    # =========== TERMS ===========
    terms_text = config.get('terms_and_conditions', '').replace('\n', '<br/>')
    if terms_text:
        terms_para = Paragraph(
            f"<b>TERMINOS Y CONDICIONES</b><br/>{terms_text}",
            ParagraphStyle('Terms', fontSize=7, leading=9, textColor=Colors.TEXT_MUTED)
        )
        elements.append(terms_para)
        elements.append(Spacer(1, 6))

    # =========== FOOTER ===========
    footer = Paragraph(
        f"<font size='7' color='#0077b6'>{config['pdf_footer_text']}</font> | "
        f"<font size='6' color='#adb5bd'>{config['company_website']}</font>",
        ParagraphStyle('Footer', fontSize=7, alignment=TA_CENTER)
    )
    elements.append(footer)
    
    doc.build(elements)
    return f"summaries/{filename}"


def delete_summary(reservation_id: str) -> bool:
    """
    Delete summary PDF for a reservation
    """
    filename = f"summary_{reservation_id}.pdf"
    file_path = Path(settings.upload_dir) / 'summaries' / filename
    
    if file_path.exists():
        try:
            file_path.unlink()
            return True
        except Exception:
            return False
    
    return False


def generate_trip_manifest(
    trip_id: str,
    origin: str,
    destination: str,
    departure_date: str,
    departure_time: Optional[str],
    truck_plate: Optional[str],
    trailer_plate: Optional[str],
    driver_name: Optional[str],
    driver_phone: Optional[str],
    total_spaces: int,
    reservations: list[dict],  # List of {client_name, client_phone, space_numbers, payment_status, total_amount}
    pdf_config: Optional[Dict[str, str]] = None,
    currency: str = "USD"
) -> str:
    """
    Generate trip manifest PDF for drivers/warehouse.
    Shows all reservations with client contacts and space allocations.
    
    Returns the path to the generated file relative to upload_dir.
    """
    manifests_dir = Path(settings.upload_dir) / 'manifests'
    manifests_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"manifest_{trip_id}.pdf"
    file_path = manifests_dir / filename
    
    doc = SimpleDocTemplate(
        str(file_path), 
        pagesize=letter,
        leftMargin=0.4*inch,
        rightMargin=0.4*inch,
        topMargin=0.3*inch,
        bottomMargin=0.3*inch
    )
    elements = []
    config = get_pdf_config(pdf_config)
    
    # Currency
    currency_symbol = "$" if currency in ["USD", "MXN"] else currency
    
    # =========== HEADER ===========
    logo_path = Path(__file__).parent.parent / 'static' / 'keikichi_logo.jpg'
    
    if logo_path.exists():
        logo = Image(str(logo_path), width=1.4*inch, height=0.56*inch)
    else:
        logo = Paragraph(f"<b>{config['company_name']}</b>", ParagraphStyle('Logo', fontSize=14, textColor=Colors.BRAND_SECONDARY))
    
    title = Paragraph(
        "<b>MANIFIESTO DE VIAJE</b>",
        ParagraphStyle('Title', fontSize=16, textColor=Colors.BRAND_SECONDARY, alignment=TA_RIGHT)
    )
    
    header = Table([[logo, title]], colWidths=[3.5*inch, 4*inch])
    header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 2, Colors.BRAND_PRIMARY),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 10))
    
    # =========== TRIP INFO ===========
    departure_str = f"{departure_date}"
    if departure_time:
        departure_str += f" - {departure_time}"
    
    route_text = Paragraph(
        f"<font size='10' color='#0077b6'>RUTA</font><br/>"
        f"<font size='18' color='#212529'><b>{origin}</b></font> "
        f"<font size='14' color='#00a8cc'>→</font> "
        f"<font size='18' color='#212529'><b>{destination}</b></font>",
        ParagraphStyle('Route', fontSize=18, leading=22)
    )
    
    route_box = Table([[route_text]], colWidths=[7.5*inch])
    route_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(route_box)
    elements.append(Spacer(1, 8))
    
    # Vehicle and driver info
    info_style = ParagraphStyle('Info', fontSize=9, leading=12)
    label_style = ParagraphStyle('Label', fontSize=8, textColor=Colors.TEXT_MUTED)
    
    vehicle_data = [
        [Paragraph("Fecha Salida", label_style), Paragraph(f"<b>{departure_str}</b>", info_style),
         Paragraph("Camión", label_style), Paragraph(f"<b>{truck_plate or 'No asignado'}</b>", info_style)],
        [Paragraph("Chofer", label_style), Paragraph(f"<b>{driver_name or 'No asignado'}</b>", info_style),
         Paragraph("Trailer", label_style), Paragraph(f"<b>{trailer_plate or 'No asignado'}</b>", info_style)],
        [Paragraph("Teléfono", label_style), Paragraph(driver_phone or "-", info_style),
         Paragraph("ID Viaje", label_style), Paragraph(trip_id[:16], info_style)],
    ]
    
    vehicle_table = Table(vehicle_data, colWidths=[1*inch, 2.5*inch, 1*inch, 3*inch])
    vehicle_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(vehicle_table)
    elements.append(Spacer(1, 12))
    
    # =========== RESERVATIONS TABLE ===========
    elements.append(Paragraph("<b>RESERVACIONES</b>", ParagraphStyle('SectionTitle', fontSize=11, textColor=Colors.BRAND_SECONDARY)))
    elements.append(Spacer(1, 6))
    
    # Table header
    header_style = ParagraphStyle('TH', fontSize=8, textColor=Colors.WHITE, alignment=TA_CENTER)
    cell_style = ParagraphStyle('TD', fontSize=8, leading=10)
    cell_center = ParagraphStyle('TDC', fontSize=8, alignment=TA_CENTER)
    
    table_data = [[
        Paragraph("<b>#</b>", header_style),
        Paragraph("<b>CLIENTE</b>", header_style),
        Paragraph("<b>TELÉFONO</b>", header_style),
        Paragraph("<b>ESPACIOS</b>", header_style),
        Paragraph("<b>MONTO</b>", header_style),
        Paragraph("<b>ESTADO</b>", header_style),
    ]]
    
    # Add rows
    confirmed_count = 0
    pending_count = 0
    total_revenue = 0
    
    for idx, res in enumerate(reservations, 1):
        spaces_str = ", ".join(map(str, sorted(res.get('space_numbers', []))))
        spaces_count = len(res.get('space_numbers', []))
        amount = res.get('total_amount', 0)
        total_revenue += float(amount)
        
        payment_status = res.get('payment_status', 'unpaid')
        if payment_status == 'paid':
            status_text = "<font color='#10b981'>✓ PAGADO</font>"
            confirmed_count += spaces_count
        elif payment_status == 'pending_review':
            status_text = "<font color='#f59e0b'>⏳ EN REVISIÓN</font>"
            pending_count += spaces_count
        else:
            status_text = "<font color='#ef4444'>✗ PENDIENTE</font>"
            pending_count += spaces_count
        
        table_data.append([
            Paragraph(str(idx), cell_center),
            Paragraph(res.get('client_name', 'Desconocido')[:25], cell_style),
            Paragraph(res.get('client_phone', '-'), cell_center),
            Paragraph(f"{spaces_str} ({spaces_count})", cell_center),
            Paragraph(f"{currency_symbol}{float(amount):,.0f}", cell_center),
            Paragraph(status_text, cell_center),
        ])
    
    # Build table
    res_table = Table(table_data, colWidths=[0.4*inch, 2.2*inch, 1.2*inch, 1.2*inch, 1*inch, 1.4*inch])
    res_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), Colors.BRAND_SECONDARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        # All cells
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        # Alternating rows
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(res_table)
    elements.append(Spacer(1, 12))
    
    # =========== SUMMARY ===========
    reserved_spaces = confirmed_count + pending_count
    available_spaces = total_spaces - reserved_spaces
    
    summary_text = Paragraph(
        f"<font size='10'><b>RESUMEN:</b> "
        f"<font color='#10b981'>{confirmed_count} confirmados</font> | "
        f"<font color='#f59e0b'>{pending_count} pendientes</font> | "
        f"<font color='#6c757d'>{available_spaces} disponibles</font> de {total_spaces} espacios</font><br/>"
        f"<font size='9' color='#6c757d'>Ingreso estimado: {currency_symbol}{total_revenue:,.2f} {currency}</font>",
        ParagraphStyle('Summary', fontSize=10, leading=14)
    )
    
    summary_box = Table([[summary_text]], colWidths=[7.5*inch])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_SECTION),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(summary_box)
    elements.append(Spacer(1, 10))
    
    # =========== QR + FOOTER ===========
    qr_buffer = generate_qr_code(f"trip:{trip_id}", box_size=6)
    qr_img = Image(qr_buffer, width=0.8*inch, height=0.8*inch)
    
    footer_text = Paragraph(
        f"<font size='7' color='#6c757d'>Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}</font><br/>"
        f"<font size='7' color='#0077b6'>{config['pdf_footer_text']}</font>",
        ParagraphStyle('FooterText', fontSize=7, leading=10)
    )
    
    footer_row = Table([[footer_text, qr_img]], colWidths=[6.5*inch, 1*inch])
    footer_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(footer_row)
    
    doc.build(elements)
    return f"manifests/{filename}"


def delete_manifest(trip_id: str) -> bool:
    """
    Delete manifest PDF for a trip
    """
    filename = f"manifest_{trip_id}.pdf"
    file_path = Path(settings.upload_dir) / 'manifests' / filename
    
    if file_path.exists():
        try:
            file_path.unlink()
            return True
        except Exception:
            return False
    
    return False


def generate_driver_manifest(
    trip_id: str,
    origin: str,
    destination: str,
    departure_date: str,
    departure_time: Optional[str],
    truck_plate: Optional[str],
    trailer_plate: Optional[str],
    driver_name: Optional[str],
    driver_phone: Optional[str],
    total_spaces: int,
    reservations: list[dict],  # Extended: {client_name, client_phone, client_email, space_numbers, payment_status, total_amount, items, pickup_address, notes}
    pdf_config: Optional[Dict[str, str]] = None,
    currency: str = "USD"
) -> str:
    """
    Generate detailed driver manifest PDF with cargo details, addresses, and signature lines.
    For driver/warehouse delivery operations.
    
    Returns the path to the generated file relative to upload_dir.
    """
    manifests_dir = Path(settings.upload_dir) / 'manifests'
    manifests_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"manifest_driver_{trip_id}.pdf"
    file_path = manifests_dir / filename
    
    doc = SimpleDocTemplate(
        str(file_path), 
        pagesize=letter,
        leftMargin=0.4*inch,
        rightMargin=0.4*inch,
        topMargin=0.3*inch,
        bottomMargin=0.3*inch
    )
    elements = []
    config = get_pdf_config(pdf_config)
    
    currency_symbol = "$" if currency in ["USD", "MXN"] else currency
    
    # =========== HEADER ===========
    logo_path = Path(__file__).parent.parent / 'static' / 'keikichi_logo.jpg'
    
    if logo_path.exists():
        logo = Image(str(logo_path), width=1.2*inch, height=0.48*inch)
    else:
        logo = Paragraph(f"<b>{config['company_name']}</b>", ParagraphStyle('Logo', fontSize=12, textColor=Colors.BRAND_SECONDARY))
    
    title = Paragraph(
        "<b>MANIFIESTO DE CHOFER</b><br/><font size='9' color='#6c757d'>Documento de entrega</font>",
        ParagraphStyle('Title', fontSize=14, textColor=Colors.BRAND_SECONDARY, alignment=TA_RIGHT, leading=16)
    )
    
    header = Table([[logo, title]], colWidths=[3*inch, 4.5*inch])
    header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 2, Colors.BRAND_PRIMARY),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 8))
    
    # =========== TRIP/VEHICLE BOX ===========
    departure_str = f"{departure_date}"
    if departure_time:
        departure_str += f" - {departure_time}"
    
    info_style = ParagraphStyle('Info', fontSize=9, leading=11)
    label_style = ParagraphStyle('Label', fontSize=7, textColor=Colors.TEXT_MUTED)
    big_style = ParagraphStyle('Big', fontSize=11, leading=13)
    
    trip_box_data = [
        [
            Paragraph(f"<font size='8' color='#0077b6'>RUTA</font><br/><b>{origin} → {destination}</b>", big_style),
            Paragraph(f"<font size='8' color='#0077b6'>SALIDA</font><br/><b>{departure_str}</b>", big_style),
        ],
        [
            Paragraph(f"Camión: <b>{truck_plate or 'N/A'}</b> | Trailer: <b>{trailer_plate or 'N/A'}</b>", info_style),
            Paragraph(f"Chofer: <b>{driver_name or 'N/A'}</b> | Tel: <b>{driver_phone or 'N/A'}</b>", info_style),
        ],
    ]
    
    trip_box = Table(trip_box_data, colWidths=[3.75*inch, 3.75*inch])
    trip_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(trip_box)
    elements.append(Spacer(1, 10))
    
    # =========== DELIVERIES (One per client) ===========
    elements.append(Paragraph("<b>ENTREGAS</b>", ParagraphStyle('SectionTitle', fontSize=11, textColor=Colors.BRAND_SECONDARY)))
    elements.append(Spacer(1, 4))
    
    phone_style = ParagraphStyle('Phone', fontSize=12, textColor=Colors.BRAND_SECONDARY, alignment=TA_CENTER)
    client_style = ParagraphStyle('Client', fontSize=9, leading=11)
    cargo_style = ParagraphStyle('Cargo', fontSize=8, leading=10, textColor=Colors.TEXT_DARK)
    notes_style = ParagraphStyle('Notes', fontSize=7, leading=9, textColor=Colors.TEXT_MUTED)
    check_style = ParagraphStyle('Check', fontSize=9, alignment=TA_CENTER)
    
    for idx, res in enumerate(reservations, 1):
        client_name = res.get('client_name', 'Cliente')
        client_phone = res.get('client_phone', '-')
        spaces = res.get('space_numbers', [])
        spaces_str = ", ".join(map(str, sorted(spaces))) if spaces else "-"
        payment_status = res.get('payment_status', 'unpaid')
        items = res.get('items', [])
        pickup_address = res.get('pickup_address', None)
        notes = res.get('notes', '')
        
        # Payment badge
        if payment_status == 'paid':
            payment_badge = "<font color='#10b981'>✓ PAGADO</font>"
        elif payment_status == 'pending_review':
            payment_badge = "<font color='#f59e0b'>⏳ REVISIÓN</font>"
        else:
            payment_badge = "<font color='#ef4444'>⚠ PENDIENTE</font>"
        
        # Build cargo details
        cargo_lines = []
        for item in items:
            product = item.get('product_name', 'Carga')
            boxes = item.get('box_count', 0)
            weight = item.get('total_weight', 0)
            cargo_lines.append(f"• {boxes}x {product} ({weight}kg)")
        
        cargo_text = "<br/>".join(cargo_lines) if cargo_lines else "Sin detalles de carga"
        
        # Address
        address_text = pickup_address if pickup_address else "Entrega en destino"
        
        # Delivery card
        card_data = [
            [
                # Column 1: Checkbox + Number
                Paragraph(f"<b>☐ {idx}</b>", check_style),
                # Column 2: Client info
                Paragraph(f"<b>{client_name}</b><br/>{payment_badge}", client_style),
                # Column 3: Phone (BIG)
                Paragraph(f"<b>📞 {client_phone}</b>", phone_style),
                # Column 4: Spaces
                Paragraph(f"<font size='7'>Espacios</font><br/><b>{spaces_str}</b>", ParagraphStyle('Sp', fontSize=9, alignment=TA_CENTER)),
            ],
            [
                Paragraph("", check_style),
                Paragraph(f"<font size='7'>📍 {address_text}</font>", notes_style),
                Paragraph(cargo_text, cargo_style),
                Paragraph(f"<font size='7'>{notes or '-'}</font>", notes_style),
            ],
        ]
        
        card = Table(card_data, colWidths=[0.5*inch, 2.3*inch, 2.2*inch, 2.5*inch])
        card.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), Colors.WHITE),
            ('BACKGROUND', (0, 1), (-1, 1), Colors.BG_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 0.5, Colors.BORDER),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, Colors.BORDER),
        ]))
        elements.append(card)
        elements.append(Spacer(1, 3))
    
    # Empty rows for additional deliveries
    if len(reservations) < 5:
        elements.append(Spacer(1, 6))
        empty_rows = [["☐", "_" * 25, "Tel: ____________", "Esp: ____"]]
        for _ in range(min(3, 5 - len(reservations))):
            empty_table = Table(empty_rows, colWidths=[0.5*inch, 2.5*inch, 2.2*inch, 2.3*inch])
            empty_table.setStyle(TableStyle([
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TEXTCOLOR', (0, 0), (-1, -1), Colors.TEXT_MUTED),
                ('LINEBELOW', (0, 0), (-1, 0), 0.5, Colors.BORDER),
            ]))
            elements.append(empty_table)
    
    elements.append(Spacer(1, 12))
    
    # =========== SUMMARY ===========
    reserved_spaces = sum(len(r.get('space_numbers', [])) for r in reservations)
    available_spaces = total_spaces - reserved_spaces
    
    summary = Paragraph(
        f"<b>Total entregas:</b> {len(reservations)} | "
        f"<b>Espacios ocupados:</b> {reserved_spaces}/{total_spaces} | "
        f"<b>Disponibles:</b> {available_spaces}",
        ParagraphStyle('SummaryLine', fontSize=9)
    )
    elements.append(summary)
    elements.append(Spacer(1, 15))
    
    # =========== SIGNATURES ===========
    elements.append(Paragraph("<b>FIRMAS</b>", ParagraphStyle('SectionTitle', fontSize=10, textColor=Colors.BRAND_SECONDARY)))
    elements.append(Spacer(1, 8))
    
    sig_data = [
        [
            Paragraph("Firma del Chofer", label_style),
            Paragraph("Firma Recibe Bodega", label_style),
            Paragraph("Fecha/Hora Llegada", label_style),
        ],
        [
            Paragraph("_" * 30, info_style),
            Paragraph("_" * 30, info_style),
            Paragraph("___ / ___ / _____ : ___", info_style),
        ],
        [
            Paragraph(f"<b>{driver_name or '_______________'}</b>", info_style),
            Paragraph("Nombre: _______________", info_style),
            Paragraph("", info_style),
        ],
    ]
    
    sig_table = Table(sig_data, colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
    sig_table.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(sig_table)
    elements.append(Spacer(1, 10))
    
    # =========== NOTES SECTION ===========
    elements.append(Paragraph("<b>OBSERVACIONES:</b>", label_style))
    notes_box = Table([["" ]], colWidths=[7.5*inch], rowHeights=[0.6*inch])
    notes_box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), Colors.BG_LIGHT),
    ]))
    elements.append(notes_box)
    elements.append(Spacer(1, 8))
    
    # =========== FOOTER ===========
    qr_buffer = generate_qr_code(f"trip:{trip_id}", box_size=5)
    qr_img = Image(qr_buffer, width=0.6*inch, height=0.6*inch)
    
    footer_text = Paragraph(
        f"<font size='6' color='#6c757d'>ID: {trip_id[:16]} | Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}</font>",
        ParagraphStyle('FooterText', fontSize=6)
    )
    
    footer_row = Table([[footer_text, qr_img]], colWidths=[6.9*inch, 0.6*inch])
    footer_row.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(footer_row)
    
    doc.build(elements)
    return f"manifests/{filename}"
