import os
from PIL import Image

def escanear_y_convertir_carpetas():
    # Detecta automáticamente la raíz de tu carpeta "web_app" en Windows
    ruta_raiz_proyecto = os.path.dirname(os.path.abspath(__file__))
    
    # 📁 RUTA EXACTA COMPROBADA: "geo", "iztapalapa", "img-nego"
    ruta_real_multimedia = os.path.join(ruta_raiz_proyecto, "geo", "iztapalapa", "img-nego")

    print(f"🚀 Iniciando optimización masiva de imágenes para tus Mapas...")
    print(f"📂 Buscando imágenes en tu ruta física real: {ruta_real_multimedia}\n")

    if not os.path.exists(ruta_real_multimedia):
        print(f"❌ Error: La ruta '{ruta_real_multimedia}' no existe en tu computadora.")
        return

    for carpeta_destino in os.listdir(ruta_real_multimedia):
        ruta_completa_subcarpeta = os.path.join(ruta_real_multimedia, carpeta_destino)
        
        if os.path.isdir(ruta_completa_subcarpeta):
            print(f"🔍 Escaneando archivos en la carpeta: [{carpeta_destino}]")
            cont_convertidos = 0
            
            for archivo in os.listdir(ruta_completa_subcarpeta):
                # Filtra tus fotos numeradas antiguas (.jpg, .jpeg, .png)
                if archivo.lower().endswith(('.jpg', '.jpeg', '.png')):
                    ruta_original = os.path.join(ruta_completa_subcarpeta, archivo)
                    nombre_base, _ = os.path.splitext(archivo)
                    ruta_nueva_webp = os.path.join(ruta_completa_subcarpeta, f"{nombre_base}.webp")
                    
                    try:
                        with Image.open(ruta_original) as img:
                            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                                img = img.convert('RGB')
                            img.save(ruta_nueva_webp, "WEBP", quality=90)
                        
                        print(f"  ✅ Convertido con éxito: {archivo} ➔ {nombre_base}.webp")
                        cont_convertidos += 1
                        os.remove(ruta_original) # Borra el archivo viejo para limpiar espacio
                        
                    except Exception as e:
                        print(f"  ❌ Error al procesar {archivo}: {e}")
            
            if cont_convertidos == 0:
                print(f"  ℹ️ Sin imágenes nuevas por convertir aquí.")
            print("-" * 50)

if __name__ == "__main__":
    escanear_y_convertir_carpetas()
    print("🎉 ¡Proceso terminado! Tus fotos ya son .webp y están listas para GitHub.")
