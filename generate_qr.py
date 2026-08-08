import qrcode

def generate_church_qr():
    url = "https://iglesiaccsj.web.app/"
    
    # Customize the QR code
    qr = qrcode.QRCode(
        version=1, # 1 is the smallest, up to 40
        error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction for adding logos later if you want
        box_size=10,
        border=4,
    )
    
    qr.add_data(url)
    qr.make(fit=True)

    # Create an image from the QR Code instance
    # You can change fill_color and back_color to match your church branding
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save it to the current directory
    output_filename = "qr_iglesiaccsj.png"
    img.save(output_filename)
    print(f"✅ Código QR generado exitosamente y guardado como: {output_filename}")

if __name__ == "__main__":
    generate_church_qr()
