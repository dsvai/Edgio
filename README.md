# Edgio - Inteligencia en Mercados de PredicciÃ³n

Edgio es una plataforma avanzada de anÃ¡lisis cuantitativo para mercados de predicciÃ³n como Polymarket. Utiliza enfoques de superforecasting e inteligencia bayesiana para identificar ineficiencias de mercado.

## ï¿½ï¿½ Despliegue en Vercel

Para desplegar este proyecto en Vercel de forma correcta:

1. **Subir a GitHub**: AsegÃºrate de que el cÃ³digo estÃ© en un repositorio de GitHub.
2. **Importar en Vercel**: Ve a [vercel.com](https://vercel.com), dale a "Add New" -> "Project" e importa tu repositorio.
3. **Configurar Variables de Entorno**: Es CRUCIAL que aÃ±adas las variables necesarias en la configuraciÃ³n de Vercel (Settings -> Environment Variables):
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini (si la usas para funciones de IA).
4. **Build settings**: Vercel detectarÃ¡ automÃ¡ticamente que es un proyecto de Vite. Los valores por defecto son correctos:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## ï¿½ï¿½ Desarrollo Local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## ï¿½ï¿½ GuÃ­a para GitHub

Si es la primera vez que lo subes, usa estos comandos:

```bash
git init
git add .
git commit -m "Initial commit: Edgio Platform"
git branch -M main
git remote add origin https://github.com/tu-usuario/nombre-del-repo.git
git push -u origin main
```

---
*Edgio no ofrece asesoramiento financiero. Los mercados de predicciÃ³n implican riesgo real.*
