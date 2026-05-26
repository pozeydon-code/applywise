# ApplyWise — Proyecto personal 3

ApplyWise es una aplicación web para optimizar una postulación laboral usando IA local. El proyecto vive en [`applywise/`](applywise/) y fue construido para demostrar un flujo completo: CV en PDF, oferta laboral, análisis de compatibilidad, contenido generado y preparación para entrevista.

## Ruta rápida

```bash
cd applywise
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) y seguí el flujo de la app.

> Para el análisis real necesitás Ollama corriendo con `qwen2.5:7b` y las variables de Supabase configuradas. Ver detalles en [`applywise/README.md`](applywise/README.md).

## Qué incluye

| Área | Implementación |
| --- | --- |
| Producto | Análisis de CV contra una oferta laboral, importación de oferta por URL y dashboard de resultados. |
| IA local | Pipeline con Qwen2.5 7B vía Ollama, sin APIs pagas externas. |
| Kit de postulación | Comparador antes/después, LinkedIn, carta de presentación, preguntas de entrevista y exportación Markdown. |
| Backend | Supabase con autenticación Magic Link, RLS y snapshots de análisis. |
| Calidad | Vitest, Playwright y CI con GitHub Actions. |
| Evidencia de uso de IA | Registro iterativo en [`applywise/docs/claude-code-log.md`](applywise/docs/claude-code-log.md). |

## Estructura

```txt
.
├── applywise/              # Aplicación Next.js principal
├── .github/workflows/      # CI
├── rubrica_evaluacion.pdf  # Rúbrica del proyecto
├── AGENTS.md               # Contexto y reglas para agentes
└── README.md               # Este resumen del repositorio
```

## Comandos principales

Desde `applywise/`:

```bash
npm run dev        # servidor local
npm run test:unit  # tests unitarios
npm run test:e2e   # tests end-to-end
npm test           # unit + e2e
```

## Siguiente paso

Para instalación completa, variables de entorno, migraciones de Supabase y arquitectura interna, seguí el README de la app: [`applywise/README.md`](applywise/README.md).
