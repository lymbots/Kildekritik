import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "kildekritik-analysis-v5";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_RENDER_OPTIONS = {
  cMapUrl: `${import.meta.env.BASE_URL}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${import.meta.env.BASE_URL}standard_fonts/`,
  useSystemFonts: true,
};

const CATEGORY_LIBRARY = [
  {
    name: "Kildetype",
    color: "#f97316",
    guide:
      "Kildetypen hjælper dig med at afkode, hvordan kilden bør læses. En dagbog, et brev, en tale og en lovtekst stiller forskellige krav til analysen.",
    questions: [
      "Hvilken type historisk materiale er dette?",
      "Hvad forventer du af sprog, form og brugssituation ud fra kildetypen?",
    ],
    relatedConcepts: ["Kilde eller fremstilling", "Offentlig eller privat", "Levn og beretning"],
  },
  {
    name: "Afsender",
    color: "#ef4444",
    guide:
      "Afsenderen er den person, gruppe eller institution, der står bag kilden. Du skal ikke kun finde navnet, men også se på rolle, position og interesser.",
    questions: [
      "Hvem taler eller skriver?",
      "Hvilken position og hvilke interesser taler afsenderen fra?",
    ],
    relatedConcepts: ["Ophavssituation", "Troværdighed", "Tendens"],
  },
  {
    name: "Modtager",
    color: "#f59e0b",
    guide:
      "Modtageren påvirker ofte både sprog, tone og strategi. En kilde kan henvende sig til én person, en bestemt gruppe eller en bred offentlighed.",
    questions: [
      "Hvem er kilden rettet mod?",
      "Hvordan former modtageren tekstens ordvalg og virkemidler?",
    ],
    relatedConcepts: ["Offentlig eller privat", "Formål"],
  },
  {
    name: "Tid: kildens tilblivelse",
    color: "#14b8a6",
    guide:
      "Du skal holde kildens tilblivelsestid adskilt fra den tid, den omtaler. Tidsafstanden er vigtig for, hvad kilden kan bruges til.",
    questions: [
      "Hvornår er kilden skrevet, sagt, trykt eller offentliggjort?",
      "Er kilden samtidig med begivenheden eller skrevet længe efter?",
    ],
    relatedConcepts: ["Første- og andenhånd", "Troværdighed"],
  },
  {
    name: "Tid: det kilden omtaler",
    color: "#06b6d4",
    guide:
      "Denne kategori handler om den periode eller begivenhed, som kilden beskriver. Forskellen mellem omtalt tid og tilblivelsestid er ofte analytisk vigtig.",
    questions: [
      "Hvornår foregår det, kilden handler om?",
      "Hvad betyder forskellen mellem oplevet tid og nedskrevet tid?",
    ],
    relatedConcepts: ["Synkron og diakron", "Første- og andenhånd"],
  },
  {
    name: "Sted",
    color: "#3b82f6",
    guide:
      "Sted kan både være der, hvor kilden er blevet til, og der, hvor det beskrevne foregår. Begge kan have betydning for perspektiv og udsagnskraft.",
    questions: [
      "Hvor er kilden skabt?",
      "Hvor foregår det, kilden omtaler?",
    ],
    relatedConcepts: ["Ophavssituation", "Kontekst"],
  },
  {
    name: "Indhold / påstande",
    color: "#6366f1",
    guide:
      "Her markerer du de konkrete udsagn, oplysninger og påstande, som resten af analysen skal bygge på. Det er kildens tekstnære belæg.",
    questions: [
      "Hvad siger kilden direkte?",
      "Hvilke formuleringer fungerer som belæg for din problemstilling?",
    ],
    relatedConcepts: ["Udsagnskraft", "Belæg"],
  },
  {
    name: "Formål",
    color: "#8b5cf6",
    guide:
      "Formålet handler om, hvad kilden forsøger at opnå. Det kan være at informere, overbevise, legitimere, mobilisere, advare eller noget helt andet.",
    questions: [
      "Hvad vil afsenderen have modtageren til at tænke, føle eller gøre?",
      "Hvordan hænger formålet sammen med afsender og modtager?",
    ],
    relatedConcepts: ["Virkemidler", "Tendens"],
  },
  {
    name: "Tendens",
    color: "#ec4899",
    guide:
      "Tendens betyder ikke bare løgn. Det handler om synsvinkel, interesse og skævhed. En tendentiøs kilde kan stadig være meget brugbar til de rigtige spørgsmål.",
    questions: [
      "Hvilke ord eller formuleringer viser holdning eller interesse?",
      "Hvem fremstilles positivt, negativt eller slet ikke?",
    ],
    relatedConcepts: ["Troværdighed", "Modtendens", "Formål"],
  },
  {
    name: "Begrænsninger / tavshed",
    color: "#10b981",
    guide:
      "En central del af funktionel kildekritik er at se, hvad kilden ikke kan bruges til. Kildens tavshed er også en oplysning.",
    questions: [
      "Hvilke perspektiver eller oplysninger mangler?",
      "Hvad kan kilden ikke sige noget sikkert om i forhold til din problemstilling?",
    ],
    relatedConcepts: ["Funktionelt kildebegreb", "Repræsentativitet"],
  },
].map((category, index) => ({
  id: `category-${index + 1}`,
  summary: "",
  ...category,
}));

const GUIDE_SECTIONS = [
  {
    title: "Det funktionelle kildebegreb",
    body:
      "En kilde er ikke god eller dårlig i sig selv. Dens værdi afhænger af, hvad du vil bruge den til, og hvilke spørgsmål du stiller.",
  },
  {
    title: "Kildekritik som metode",
    body:
      "Kildekritik er ikke en tjekliste. Du undersøger indhold, ophav, situation og brugbarhed for at vurdere, hvad kilden kan bruges til.",
  },
  {
    title: "Levn og beretning",
    body:
      "Den samme kilde kan bruges både som levn og som beretning. Du skal derfor spørge: Bruger jeg denne kilde som spor fra sin samtid, eller som udsagn om en begivenhed uden for teksten?",
  },
  {
    title: "Levnsslutning og beretningsslutning",
    body:
      "Når du bruger kilden som levn, ser du den som spor fra sin samtid. Når du bruger den som beretning, ser du den som en fortælling om noget. Hvad der er bedst, afhænger af dit spørgsmål.",
  },
  {
    title: "Troværdighed og tendens",
    body:
      "En kilde kan have tydelig tendens og stadig være værdifuld. Det afgørende er, om du bruger den til et spørgsmål, hvor netop dens perspektiv, interesser eller sprog er relevant.",
  },
  {
    title: "Første- og andenhånd",
    body:
      "Spørg hvor tæt afsenderen er på det beskrevne. Har afsenderen selv oplevet det, eller bygger udsagnet på noget hørt, læst eller viderefortalt?",
  },
  {
    title: "Hvad siger kilden ikke?",
    body:
      "En god analyse ser også på fravær. Hvem mangler? Hvilke oplysninger får du ikke? Hvad kræver andre kilder?",
  },
];

function createSource(index = 1) {
  return {
    id: `source-${uid("tab")}`,
    title: "",
    problemStatement: "",
    finalAnalysis: "",
    sourceMode: "text",
    sourceText: "",
    categories: CATEGORY_LIBRARY.map((category) => ({ ...category })),
    annotations: [],
    order: index,
  };
}

function createTimelineData(annotation, sourceText) {
  const excerpt = getAnnotationExcerpt(annotation, sourceText);
  return {
    title: excerpt.length > 72 ? `${excerpt.slice(0, 69).trimEnd()}...` : excerpt,
    dateLabel: "",
    sortYear: "",
    endYear: "",
    note: "",
  };
}

function normalizeCategory(category, index) {
  const fallback = CATEGORY_LIBRARY[index];
  return {
    id: category?.id ?? fallback?.id ?? uid("category"),
    name: category?.name ?? fallback?.name ?? "Kategori",
    color: category?.color ?? fallback?.color ?? "#94a3b8",
    guide: category?.guide ?? fallback?.guide ?? "",
    questions: Array.isArray(category?.questions) ? category.questions : fallback?.questions ?? [],
    relatedConcepts: Array.isArray(category?.relatedConcepts)
      ? category.relatedConcepts
      : fallback?.relatedConcepts ?? [],
    summary: typeof category?.summary === "string" ? category.summary : "",
  };
}

function normalizeAnnotation(annotation, sourceText) {
  const timeline = annotation?.timeline && typeof annotation.timeline === "object"
    ? {
        title: typeof annotation.timeline.title === "string" ? annotation.timeline.title : "",
        dateLabel: typeof annotation.timeline.dateLabel === "string" ? annotation.timeline.dateLabel : "",
        sortYear:
          annotation.timeline.sortYear === "" || Number.isFinite(Number(annotation.timeline.sortYear))
            ? annotation.timeline.sortYear
            : "",
        endYear:
          annotation.timeline.endYear === "" || Number.isFinite(Number(annotation.timeline.endYear))
            ? annotation.timeline.endYear
            : "",
        note: typeof annotation.timeline.note === "string" ? annotation.timeline.note : "",
      }
    : null;

  return {
    ...annotation,
    comment: typeof annotation?.comment === "string" ? annotation.comment : "",
    quote: typeof annotation?.quote === "string" ? annotation.quote : "",
    timeline,
  };
}

function normalizeSource(source, index) {
  return {
    id: source?.id ?? `source-${uid("tab")}`,
    title: typeof source?.title === "string" ? source.title : "",
    problemStatement: typeof source?.problemStatement === "string" ? source.problemStatement : "",
    finalAnalysis: typeof source?.finalAnalysis === "string" ? source.finalAnalysis : "",
    sourceMode: source?.sourceMode === "pdf" ? "pdf" : "text",
    sourceText: typeof source?.sourceText === "string" ? source.sourceText : "",
    categories:
      Array.isArray(source?.categories) && source.categories.length
        ? source.categories.map((category, categoryIndex) => normalizeCategory(category, categoryIndex))
        : CATEGORY_LIBRARY.map((category) => ({ ...category })),
    annotations: Array.isArray(source?.annotations)
      ? source.annotations.map((annotation) => normalizeAnnotation(annotation, source?.sourceText ?? ""))
      : [],
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : index + 1,
  };
}

function normalizeAnalysisState(raw) {
  const rawSources = Array.isArray(raw?.sources) && raw.sources.length ? raw.sources : [createSource(1)];
  const sources = rawSources.map((source, index) => normalizeSource(source, index));
  const activeSourceId = sources.find((source) => source.id === raw?.activeSourceId)?.id ?? sources[0].id;

  return {
    title: typeof raw?.title === "string" ? raw.title : "",
    sources,
    activeSourceId,
  };
}

const INITIAL_STATE = {
  title: "",
  sources: [createSource(1)],
  activeSourceId: "",
};

function sortAnnotationsForOutput(annotations) {
  return [...annotations].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "text" ? -1 : 1;
    }

    if (a.type === "text") {
      if (Array.isArray(a.pdfRects) || Array.isArray(b.pdfRects)) {
        if ((a.pageIndex ?? 0) !== (b.pageIndex ?? 0)) {
          return (a.pageIndex ?? 0) - (b.pageIndex ?? 0);
        }

        const rectA = a.pdfRects?.[0];
        const rectB = b.pdfRects?.[0];
        if (rectA && rectB && rectA.y !== rectB.y) {
          return rectA.y - rectB.y;
        }
        if (rectA && rectB && rectA.x !== rectB.x) {
          return rectA.x - rectB.x;
        }
      }

      return (a.start ?? 0) - (b.start ?? 0);
    }

    if (a.pageIndex !== b.pageIndex) {
      return a.pageIndex - b.pageIndex;
    }

    if (a.y !== b.y) {
      return a.y - b.y;
    }

    return a.x - b.x;
  });
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeText(text) {
  return text.replace(/\r\n/g, "\n");
}

function normalizeSelectionText(text) {
  return normalizeText(text)
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getFileTitle(name) {
  return name.replace(/\.[^.]+$/, "").trim();
}

function getSelectionOffsets(root, selection) {
  if (!root || !selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const calculateOffset = (node, offset) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;

    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current === node) {
        return currentOffset + offset;
      }
      currentOffset += current.textContent.length;
    }

    return null;
  };

  const start = calculateOffset(range.startContainer, range.startOffset);
  const end = calculateOffset(range.endContainer, range.endOffset);

  if (start == null || end == null || start === end) {
    return null;
  }

  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function splitTextForAnnotations(text, annotations) {
  if (!text) {
    return [];
  }

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  sorted.forEach((annotation) => {
    if (annotation.start > cursor) {
      segments.push({ type: "plain", text: text.slice(cursor, annotation.start) });
    }

    segments.push({
      type: "annotation",
      text: text.slice(annotation.start, annotation.end),
      annotation,
    });

    cursor = annotation.end;
  });

  if (cursor < text.length) {
    segments.push({ type: "plain", text: text.slice(cursor) });
  }

  return segments;
}

function splitTextForPrint(text, annotations, annotationNumbers) {
  if (!text) {
    return [];
  }

  const sorted = sortAnnotationsForOutput(annotations).filter((annotation) => annotation.type === "text");
  const segments = [];
  let cursor = 0;

  sorted.forEach((annotation) => {
    if (annotation.start > cursor) {
      segments.push({ type: "plain", text: text.slice(cursor, annotation.start) });
    }

    segments.push({
      type: "annotation",
      text: text.slice(annotation.start, annotation.end),
      annotation,
      number: annotationNumbers.get(annotation.id),
    });

    cursor = annotation.end;
  });

  if (cursor < text.length) {
    segments.push({ type: "plain", text: text.slice(cursor) });
  }

  return segments;
}

function getAnnotationExcerpt(annotation, sourceText) {
  if (annotation.type === "text") {
    if (annotation.quote?.trim()) {
      return annotation.quote.trim();
    }

    if (typeof annotation.start === "number" && typeof annotation.end === "number") {
      return sourceText.slice(annotation.start, annotation.end).trim() || "Tom markering";
    }

    return "Tekstmarkering";
  }

  return `Visuel markering på side ${annotation.pageIndex + 1}`;
}

function getAnnotationLabel(annotation, sourceText, annotationNumbers) {
  if (annotation.type === "region") {
    const number = annotationNumbers?.get(annotation.id);
    return number
      ? `Overstregning ${number} · side ${annotation.pageIndex + 1}`
      : `Overstregning · side ${annotation.pageIndex + 1}`;
  }

  if (annotation.type === "text" && annotation.quote?.trim()) {
    return annotation.quote.trim();
  }

  if (typeof annotation.start === "number" && typeof annotation.end === "number") {
    return sourceText.slice(annotation.start, annotation.end).trim() || "Tom markering";
  }

  return "Tekstmarkering";
}

function getTextPieceSegments(pieceText, pieceStart, annotations) {
  const relevant = annotations
    .filter((annotation) => annotation.type === "text")
    .filter((annotation) => annotation.start < pieceStart + pieceText.length && annotation.end > pieceStart)
    .sort((a, b) => a.start - b.start);

  if (!relevant.length) {
    return [{ type: "plain", text: pieceText }];
  }

  const segments = [];
  let localCursor = 0;

  relevant.forEach((annotation) => {
    const start = Math.max(annotation.start - pieceStart, 0);
    const end = Math.min(annotation.end - pieceStart, pieceText.length);

    if (start > localCursor) {
      segments.push({ type: "plain", text: pieceText.slice(localCursor, start) });
    }

    segments.push({
      type: "annotation",
      text: pieceText.slice(start, end),
      annotation,
    });

    localCursor = end;
  });

  if (localCursor < pieceText.length) {
    segments.push({ type: "plain", text: pieceText.slice(localCursor) });
  }

  return segments;
}

function getPageFrameFromNode(node) {
  if (!(node instanceof Node)) {
    return null;
  }

  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return element?.closest("[data-page-frame='true']") ?? null;
}

async function loadPdfDocument(file) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: buffer,
    ...PDF_RENDER_OPTIONS,
  }).promise;

  const pages = [];
  let fullText = "";
  let hasAnyText = false;

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const content = await page.getTextContent({
      includeMarkedContent: true,
      disableNormalization: true,
    });
    let pageHasText = false;

    content.items.forEach((item) => {
      if (!("str" in item)) {
        return;
      }

      const raw = item.str ?? "";
      const normalized = raw.replace(/\u0000/g, "").replace(/\s+/g, " ");
      const suffix = item.hasEOL ? "\n" : raw ? " " : "";
      const pieceText = normalized + suffix;
      const start = fullText.length;
      const end = start + pieceText.length;

      fullText += pieceText;

      if (normalized.trim()) {
        pageHasText = true;
        hasAnyText = true;
      }
    });

    pages.push({
      pageIndex,
      pdfPage: page,
      viewport,
      imageUrl: canvas.toDataURL("image/png"),
      width: viewport.width,
      height: viewport.height,
      hasText: pageHasText,
    });
  }

  return {
    fullText: normalizeText(fullText),
    pages,
    hasAnyText,
  };
}

function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [analysis, setAnalysis] = useState(() => {
    const firstSource = INITIAL_STATE.sources[0];
    return {
      ...INITIAL_STATE,
      activeSourceId: firstSource.id,
    };
  });
  const [sourceDocuments, setSourceDocuments] = useState({});
  const [activeCategoryId, setActiveCategoryId] = useState(CATEGORY_LIBRARY[0].id);
  const [openCategoryId, setOpenCategoryId] = useState(CATEGORY_LIBRARY[0].id);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [draftCategoryName, setDraftCategoryName] = useState("");
  const [draftCategoryColor, setDraftCategoryColor] = useState("#1d4ed8");
  const [statusMessage, setStatusMessage] = useState("");
  const [isImportPanelOpen, setIsImportPanelOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [expandedGuideIds, setExpandedGuideIds] = useState(() => new Set());
  const [interactionMode, setInteractionMode] = useState("select");
  const [dragState, setDragState] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const sourceSurfaceRef = useRef(null);
  const pdfTextLayerRefs = useRef(new Map());

  const currentSource =
    analysis.sources.find((source) => source.id === analysis.activeSourceId) ?? analysis.sources[0];
  const projectTitle = analysis.title.trim();
  const currentDocumentPages = sourceDocuments[analysis.activeSourceId] ?? [];

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = normalizeAnalysisState(JSON.parse(raw));
      if (!parsed?.sources?.length) {
        setIsHydrated(true);
        return;
      }

      setAnalysis(parsed);
      setActiveCategoryId(parsed.sources[0].categories[0].id);
      setOpenCategoryId(parsed.sources[0].categories[0].id);

      if (parsed.sources.some((source) => source.sourceMode === "pdf")) {
        setStatusMessage("PDF-filer skal importeres igen, hvis du genåbner siden.");
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(analysis));
  }, [analysis, isHydrated]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    let isCancelled = false;
    const cleanups = [];

    async function renderPdfTextLayers() {
      if (currentSource.sourceMode !== "pdf" || !currentDocumentPages.length) {
        return;
      }

      const { TextLayerBuilder } = await import("pdfjs-dist/web/pdf_viewer.mjs");

      for (const page of currentDocumentPages) {
        const container = pdfTextLayerRefs.current.get(page.pageIndex);
        if (!container || !page.hasText) {
          continue;
        }

        container.replaceChildren();

        const textLayer = new TextLayerBuilder({
          pdfPage: page.pdfPage,
          onAppend: (textLayerDiv) => {
            container.replaceChildren(textLayerDiv);
          },
        });

        cleanups.push(() => {
          textLayer.cancel();
          container.replaceChildren();
        });

        try {
          await textLayer.render({
            viewport: page.viewport,
          });
        } catch {
          if (!isCancelled) {
            setStatusMessage("Tekstlaget på PDF'en kunne ikke vises korrekt.");
          }
        }
      }
    }

    renderPdfTextLayers();

    return () => {
      isCancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [currentSource.sourceMode, currentDocumentPages, analysis.activeSourceId]);

  const activeCategory = useMemo(
    () => currentSource.categories.find((category) => category.id === activeCategoryId) ?? currentSource.categories[0],
    [activeCategoryId, currentSource.categories],
  );

  const selectedAnnotation = useMemo(
    () => currentSource.annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [currentSource.annotations, selectedAnnotationId],
  );

  const categoriesWithStats = useMemo(
    () =>
      currentSource.categories.map((category) => {
        const annotations = currentSource.annotations.filter((annotation) => annotation.categoryId === category.id);
        const completed =
          Boolean(category.summary.trim()) || annotations.some((annotation) => annotation.comment.trim());

        return {
          ...category,
          annotationCount: annotations.length,
          completed,
          annotations,
        };
      }),
    [currentSource.annotations, currentSource.categories],
  );

  const coveredCategories = categoriesWithStats.filter((category) => category.completed).length;
  const progressPercent = Math.round((coveredCategories / categoriesWithStats.length) * 100) || 0;

  const visibleAnnotations = useMemo(
    () =>
      currentSource.annotations.map((annotation) => {
        const category = currentSource.categories.find((item) => item.id === annotation.categoryId);
        return {
          ...annotation,
          categoryName: category?.name ?? "Kategori",
          color: category?.color ?? "#94a3b8",
          muted: annotation.categoryId !== activeCategoryId,
          selected: annotation.id === selectedAnnotationId,
        };
      }),
    [activeCategoryId, currentSource.annotations, currentSource.categories, selectedAnnotationId],
  );

  const orderedAnnotations = useMemo(
    () => sortAnnotationsForOutput(currentSource.annotations),
    [currentSource.annotations],
  );

  const annotationNumbers = useMemo(() => {
    const map = new Map();
    orderedAnnotations.forEach((annotation, index) => {
      map.set(annotation.id, index + 1);
    });
    return map;
  }, [orderedAnnotations]);

  const textAnnotations = useMemo(
    () => visibleAnnotations.filter((annotation) => annotation.type === "text").sort((a, b) => a.start - b.start),
    [visibleAnnotations],
  );

  const textSegments = useMemo(
    () => splitTextForAnnotations(currentSource.sourceText, textAnnotations),
    [currentSource.sourceText, textAnnotations],
  );

  const printTextSegments = useMemo(
    () => splitTextForPrint(currentSource.sourceText, currentSource.annotations, annotationNumbers),
    [currentSource.annotations, currentSource.sourceText, annotationNumbers],
  );

  const timelineEntries = useMemo(() => {
    const entries = [];

    analysis.sources.forEach((source, sourceIndex) => {
      source.annotations.forEach((annotation) => {
        if (!annotation.timeline) {
          return;
        }

        const category = source.categories.find((item) => item.id === annotation.categoryId);

        entries.push({
          id: annotation.id,
          sourceId: source.id,
          sourceIndex,
          sourceTitle: source.title || `Kilde ${sourceIndex + 1}`,
          categoryName: category?.name ?? "Kategori",
          color: category?.color ?? "#94a3b8",
          excerpt: getAnnotationExcerpt(annotation, source.sourceText),
          comment: annotation.comment,
          timeline: {
            ...annotation.timeline,
            sortYear: annotation.timeline.sortYear === "" ? null : Number(annotation.timeline.sortYear),
            endYear: annotation.timeline.endYear === "" ? null : Number(annotation.timeline.endYear),
          },
        });
      });
    });

    return entries.sort((a, b) => {
      const yearA = a.timeline.sortYear ?? Number.POSITIVE_INFINITY;
      const yearB = b.timeline.sortYear ?? Number.POSITIVE_INFINITY;

      if (yearA !== yearB) {
        return yearA - yearB;
      }

      if (a.sourceIndex !== b.sourceIndex) {
        return a.sourceIndex - b.sourceIndex;
      }

      return a.timeline.title.localeCompare(b.timeline.title, "da");
    });
  }, [analysis.sources]);

  const timelineReadyCount = timelineEntries.filter((entry) => entry.timeline.dateLabel.trim()).length;

  const pageRegionAnnotations = useMemo(() => {
    const regions = new Map();
    visibleAnnotations
      .filter((annotation) => annotation.type === "region")
      .forEach((annotation) => {
        const pageList = regions.get(annotation.pageIndex) ?? [];
        pageList.push(annotation);
        regions.set(annotation.pageIndex, pageList);
      });
    return regions;
  }, [visibleAnnotations]);

  const pageTextRectAnnotations = useMemo(() => {
    const map = new Map();
    visibleAnnotations
      .filter((annotation) => annotation.type === "text" && Array.isArray(annotation.pdfRects))
      .forEach((annotation) => {
        const list = map.get(annotation.pageIndex) ?? [];
        list.push(annotation);
        map.set(annotation.pageIndex, list);
      });
    return map;
  }, [visibleAnnotations]);

  function updateAnalysis(next) {
    setAnalysis((current) => (typeof next === "function" ? next(current) : next));
  }

  function updateCurrentSource(next) {
    setAnalysis((current) => ({
      ...current,
      sources: current.sources.map((source) =>
        source.id === current.activeSourceId ? (typeof next === "function" ? next(source) : next) : source,
      ),
    }));
  }

  function setCurrentDocumentPages(nextPages) {
    setSourceDocuments((current) => ({
      ...current,
      [analysis.activeSourceId]: nextPages,
    }));
  }

  function handleFieldChange(field, value) {
    if (field === "projectTitle") {
      updateAnalysis((current) => ({
        ...current,
        title: value,
      }));
      return;
    }

    updateCurrentSource((source) => ({
      ...source,
      [field]: value,
    }));
  }

  function handleSourceTextChange(value) {
    const normalized = normalizeText(value);
    updateCurrentSource((source) => ({
      ...source,
      sourceMode: "text",
      sourceText: normalized,
      annotations: source.annotations.filter((annotation) => {
        if (annotation.type !== "text") {
          return false;
        }

        return (
          typeof annotation.start === "number" &&
          typeof annotation.end === "number" &&
          annotation.end <= normalized.length
        );
      }),
    }));
    setCurrentDocumentPages([]);
    setInteractionMode("select");
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }
    await importProvidedFile(file);
  }

  async function importProvidedFile(file) {
    if (!file) {
      return;
    }

    try {
      const inferredTitle = getFileTitle(file.name);

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfData = await loadPdfDocument(file);

        updateCurrentSource((source) => ({
          ...source,
          title: source.title.trim() ? source.title : inferredTitle,
          sourceMode: "pdf",
          sourceText: pdfData.fullText,
          annotations: source.annotations.filter(
            (annotation) => annotation.type !== "text" && annotation.type !== "region",
          ),
        }));
        setCurrentDocumentPages(pdfData.pages);
        setInteractionMode(pdfData.hasAnyText ? "select" : "draw");
        setIsImportPanelOpen(false);

        if (pdfData.hasAnyText) {
          setStatusMessage("PDF er importeret.");
        } else {
          setStatusMessage("PDF er importeret som billede. Brug tegnemarkering.");
        }
        return;
      }

      const isDocx = file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
      const lowerName = file.name.toLowerCase();
      const isPlainText =
        file.type === "text/plain" ||
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md");

      if (isDocx) {
        const mammoth = await import("mammoth");
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        handleSourceTextChange(result.value);
        updateCurrentSource((source) => ({
          ...source,
          title: source.title.trim() ? source.title : inferredTitle,
        }));
        setIsImportPanelOpen(false);
        setStatusMessage("Word-fil er importeret som tekst.");
        return;
      }

      if (!isPlainText) {
        setStatusMessage("Upload understøtter PDF, DOCX og rene tekstfiler.");
        return;
      }

      const text = await file.text();
      handleSourceTextChange(text);
      updateCurrentSource((source) => ({
        ...source,
        title: source.title.trim() ? source.title : inferredTitle,
      }));
      setIsImportPanelOpen(false);
      setStatusMessage("Tekstfil er importeret.");
    } catch {
      setStatusMessage("Importen mislykkedes. Prøv en anden fil.");
    }
  }

  function addTextAnnotationFromSelection(mode = "create") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !activeCategory) {
      setStatusMessage("Markér først tekst i kilden.");
      return;
    }

    let offsets = null;
    let selectedText = "";
    let pdfRects = null;
    let pageIndex = null;

    if (currentSource.sourceMode === "pdf") {
      const range = selection.getRangeAt(0);
      const startFrame = getPageFrameFromNode(range.startContainer);
      const endFrame = getPageFrameFromNode(range.endContainer);

      if (!startFrame || !endFrame || startFrame !== endFrame) {
        setStatusMessage("Markér inden for samme side.");
        return;
      }

      pageIndex = Number(startFrame.dataset.pageIndex);
      selectedText = normalizeSelectionText(selection.toString());
      if (!selectedText) {
        setStatusMessage("Tom markering blev ignoreret.");
        return;
      }

      const frameRect = startFrame.getBoundingClientRect();
      const rects = Array.from(range.getClientRects())
        .filter((rect) => rect.width > 1 && rect.height > 1)
        .map((rect) => ({
          x: (rect.left - frameRect.left) / frameRect.width,
          y: (rect.top - frameRect.top) / frameRect.height,
          width: rect.width / frameRect.width,
          height: rect.height / frameRect.height,
        }));

      if (!rects.length) {
        setStatusMessage("Markeringen kunne ikke oprettes.");
        return;
      }

      pdfRects = rects;
    } else {
      offsets = getSelectionOffsets(sourceSurfaceRef.current, selection);

      if (!offsets) {
        setStatusMessage("Markér først tekst i kilden.");
        return;
      }

      selectedText = currentSource.sourceText.slice(offsets.start, offsets.end).trim();
      if (!selectedText) {
        setStatusMessage("Tom markering blev ignoreret.");
        return;
      }
    }

    if (mode === "replace" && selectedAnnotation?.type === "text") {
      updateCurrentSource((source) => ({
        ...source,
        annotations: source.annotations
          .map((annotation) =>
            annotation.id === selectedAnnotation.id
              ? {
                  ...annotation,
                  start: offsets?.start ?? annotation.start,
                  end: offsets?.end ?? annotation.end,
                  pageIndex,
                  pdfRects,
                  quote: currentSource.sourceMode === "pdf" ? selectedText : annotation.quote,
                }
              : annotation,
          )
          .sort((a, b) => (a.start ?? 0) - (b.start ?? 0)),
      }));
      selection.removeAllRanges();
      setStatusMessage("Markering opdateret.");
      return;
    }

    const overlap =
      currentSource.sourceMode !== "pdf" &&
      currentSource.annotations.some(
        (annotation) =>
          annotation.type === "text" && offsets.start < annotation.end && offsets.end > annotation.start,
      );

    if (overlap) {
      setStatusMessage("Overlappende markeringer er ikke klar endnu.");
      return;
    }

    const newAnnotation = {
      id: uid("annotation"),
      type: "text",
      categoryId: activeCategory.id,
      start: offsets?.start ?? null,
      end: offsets?.end ?? null,
      pageIndex,
      pdfRects,
      quote: currentSource.sourceMode === "pdf" ? selectedText : "",
      comment: "",
      timeline: null,
    };

    updateCurrentSource((source) => ({
      ...source,
      annotations: [...source.annotations, newAnnotation].sort((a, b) => (a.start ?? 0) - (b.start ?? 0)),
    }));
    setSelectedAnnotationId(newAnnotation.id);
    setOpenCategoryId(activeCategory.id);
    selection.removeAllRanges();
    setStatusMessage(`Tekstmarkering oprettet i ${activeCategory.name}.`);
  }

  function updateAnnotationComment(annotationId, comment) {
    updateCurrentSource((source) => ({
      ...source,
      annotations: source.annotations.map((annotation) =>
        annotation.id === annotationId ? { ...annotation, comment } : annotation,
      ),
    }));
  }

  function toggleAnnotationTimeline(annotationId) {
    updateCurrentSource((source) => ({
      ...source,
      annotations: source.annotations.map((annotation) => {
        if (annotation.id !== annotationId) {
          return annotation;
        }

        return {
          ...annotation,
          timeline: annotation.timeline ? null : createTimelineData(annotation, source.sourceText),
        };
      }),
    }));
  }

  function updateAnnotationTimeline(annotationId, changes) {
    updateCurrentSource((source) => ({
      ...source,
      annotations: source.annotations.map((annotation) => {
        if (annotation.id !== annotationId || !annotation.timeline) {
          return annotation;
        }

        return {
          ...annotation,
          timeline: {
            ...annotation.timeline,
            ...changes,
          },
        };
      }),
    }));
  }

  function deleteAnnotation(annotationId) {
    updateCurrentSource((source) => ({
      ...source,
      annotations: source.annotations.filter((annotation) => annotation.id !== annotationId),
    }));

    if (selectedAnnotationId === annotationId) {
      setSelectedAnnotationId(null);
    }
  }

  function updateCategory(categoryId, changes) {
    updateCurrentSource((source) => ({
      ...source,
      categories: source.categories.map((category) =>
        category.id === categoryId ? { ...category, ...changes } : category,
      ),
    }));
  }

  function addCategory() {
    const trimmedName = draftCategoryName.trim();
    if (!trimmedName) {
      setStatusMessage("Skriv et kategorinavn først.");
      return;
    }

    const newCategory = {
      id: uid("category"),
      name: trimmedName,
      color: draftCategoryColor,
      summary: "",
      guide: "Egen kategori. Brug den til et perspektiv, der er vigtigt for netop denne kilde.",
      questions: ["Hvad hjælper denne kategori dig med at undersøge?"],
      relatedConcepts: ["Egen vinkel"],
    };

    updateCurrentSource((source) => ({
      ...source,
      categories: [...source.categories, newCategory],
    }));
    setActiveCategoryId(newCategory.id);
    setOpenCategoryId(newCategory.id);
    setDraftCategoryName("");
    setStatusMessage("Ny kategori tilføjet.");
  }

  function deleteCategory(categoryId) {
    const category = currentSource.categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    const remainingCategories = currentSource.categories.filter((item) => item.id !== categoryId);
    if (!remainingCategories.length) {
      setStatusMessage("Der skal altid være mindst én kategori.");
      return;
    }

    const confirmed = window.confirm(`Slet kategorien "${category.name}" og alle dens markeringer?`);
    if (!confirmed) {
      return;
    }

    updateCurrentSource((source) => ({
      ...source,
      categories: remainingCategories,
      annotations: source.annotations.filter((annotation) => annotation.categoryId !== categoryId),
    }));

    if (selectedAnnotation?.categoryId === categoryId) {
      setSelectedAnnotationId(null);
    }
    if (activeCategoryId === categoryId) {
      setActiveCategoryId(remainingCategories[0].id);
    }
    if (openCategoryId === categoryId) {
      setOpenCategoryId(remainingCategories[0].id);
    }
  }

  function clearAnalysis() {
    const confirmed = window.confirm("Vil du nulstille hele analysen? Alt lokalt arbejde fjernes.");
    if (!confirmed) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    const resetSource = createSource(1);
    setAnalysis({
      title: "",
      sources: [resetSource],
      activeSourceId: resetSource.id,
    });
    setSourceDocuments({});
    setActiveCategoryId(resetSource.categories[0].id);
    setOpenCategoryId(resetSource.categories[0].id);
    setSelectedAnnotationId(null);
    setInteractionMode("select");
    setIsImportPanelOpen(true);
    setStatusMessage("Analysen er nulstillet.");
  }

  function printAnalysis() {
    const previousTitle = document.title;
    const safeTitle = projectTitle
      ? projectTitle.replace(/\s+/g, "_")
      : currentSource.title?.trim()
        ? currentSource.title.trim().replace(/\s+/g, "_")
      : "uden_titel";
    document.title = `Kildekritik_${safeTitle}`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  }

  function handleRegionPointerDown(pageIndex, event) {
    if (interactionMode !== "draw") {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const startX = (event.clientX - rect.left) / rect.width;
    const startY = (event.clientY - rect.top) / rect.height;

    setDragState({
      pageIndex,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
  }

  function handleRegionPointerMove(event) {
    if (!dragState) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const currentX = (event.clientX - rect.left) / rect.width;
    const currentY = (event.clientY - rect.top) / rect.height;

    setDragState((current) => (current ? { ...current, currentX, currentY } : null));
  }

  function handleRegionPointerUp(event) {
    if (!dragState || !activeCategory) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const endX = (event.clientX - rect.left) / rect.width;
    const endY = (event.clientY - rect.top) / rect.height;

    const x = Math.min(dragState.startX, endX);
    const y = Math.min(dragState.startY, endY);
    const width = Math.abs(endX - dragState.startX);
    const height = Math.abs(endY - dragState.startY);

    setDragState(null);

    if (width < 0.015 || height < 0.015) {
      setStatusMessage("Markeringen var for lille. Træk en tydeligere visuel markering.");
      return;
    }

    const newAnnotation = {
      id: uid("annotation"),
      type: "region",
      categoryId: activeCategory.id,
      pageIndex: dragState.pageIndex,
      x,
      y,
      width,
      height,
      comment: "",
      timeline: null,
    };

    updateCurrentSource((source) => ({
      ...source,
      annotations: [...source.annotations, newAnnotation],
    }));
    setSelectedAnnotationId(newAnnotation.id);
    setOpenCategoryId(activeCategory.id);
    setStatusMessage(`Visuel markering oprettet i ${activeCategory.name}.`);
  }

  const currentDragRect =
    dragState && dragState.pageIndex != null
      ? {
          left: `${Math.min(dragState.startX, dragState.currentX) * 100}%`,
          top: `${Math.min(dragState.startY, dragState.currentY) * 100}%`,
          width: `${Math.abs(dragState.currentX - dragState.startX) * 100}%`,
          height: `${Math.abs(dragState.currentY - dragState.startY) * 100}%`,
        }
      : null;

  function handleDropZoneDragOver(event) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDropZoneDragEnter(event) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDropZoneDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDragActive(false);
  }

  async function handleDropZoneDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await importProvidedFile(file);
    }
  }

  function toggleExpandedGuide(categoryId) {
    setExpandedGuideIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function switchSource(sourceId) {
    const nextSource = analysis.sources.find((source) => source.id === sourceId);
    if (!nextSource) {
      return;
    }
    setAnalysis((current) => ({
      ...current,
      activeSourceId: sourceId,
    }));
    setActiveCategoryId(nextSource.categories[0]?.id ?? CATEGORY_LIBRARY[0].id);
    setOpenCategoryId(nextSource.categories[0]?.id ?? CATEGORY_LIBRARY[0].id);
    setSelectedAnnotationId(null);
    setInteractionMode(nextSource.sourceMode === "pdf" ? "select" : "select");
    setIsImportPanelOpen(nextSource.sourceMode === "text");
  }

  function addSource() {
    const nextSource = createSource(analysis.sources.length + 1);
    setAnalysis((current) => ({
      ...current,
      sources: [...current.sources, nextSource],
      activeSourceId: nextSource.id,
    }));
    setActiveCategoryId(nextSource.categories[0].id);
    setOpenCategoryId(nextSource.categories[0].id);
    setSelectedAnnotationId(null);
    setInteractionMode("select");
    setIsImportPanelOpen(true);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Tekstnær kildekritik</p>
          <h1>Kod kilder direkte i teksten</h1>
          <p className="intro">
            Vælg en kategori, markér i kilden, og skriv din kommentar i panelet.
          </p>
          <p className="intro intro-subtle">
            Brug PDF med tekstlag, DOCX eller indsæt tekst direkte. Scannede PDF&apos;er markeres manuelt.
          </p>
        </div>
        <div className="hero-actions hero-actions-stacked">
          <button type="button" className="secondary-button" onClick={() => setIsGuideOpen((current) => !current)}>
            {isGuideOpen ? "Skjul guide" : "Åbn guide"}
          </button>
          <button
            type="button"
            className={isTimelineOpen ? "primary-button" : "secondary-button"}
            onClick={() => setIsTimelineOpen((current) => !current)}
          >
            {isTimelineOpen ? "Skjul tidslinje" : `Åbn tidslinje${timelineEntries.length ? ` (${timelineEntries.length})` : ""}`}
          </button>
          <button type="button" className="secondary-button" onClick={clearAnalysis}>
            Clear all
          </button>
          <button type="button" className="primary-button" onClick={printAnalysis}>
            Print analyse
          </button>
        </div>
      </header>

      <section className="setup-grid">
        <label className="field-card">
          <span className="field-label">Forløb / emne</span>
          <input
            value={analysis.title}
            onChange={(event) => handleFieldChange("projectTitle", event.target.value)}
            placeholder="Fx: Kold krig og propaganda"
          />
        </label>

        <label className="field-card">
          <span className="field-label">{`Kildetitel · Kilde ${analysis.sources.findIndex((source) => source.id === currentSource.id) + 1}`}</span>
          <input
            value={currentSource.title}
            onChange={(event) => handleFieldChange("title", event.target.value)}
            placeholder="Fx: Tale af Kennedy"
          />
        </label>

        <label className="field-card field-card-wide">
          <span className="field-label">Problemstilling</span>
          <textarea
            value={currentSource.problemStatement}
            onChange={(event) => handleFieldChange("problemStatement", event.target.value)}
            placeholder="Hvilket spørgsmål vil du bruge kilden til at undersøge?"
            rows={3}
          />
        </label>
      </section>

      <section className="source-tabs-card">
        <div className="source-tabs-wrap">
          <div>
            <p className="panel-label">Kilder</p>
            <p className="source-tabs-note">Tilføj og navngiv de 4-6 kilder, der hører til samme opgave.</p>
          </div>
          <div className="source-tabs">
            {analysis.sources.map((source, index) => (
              <button
                key={source.id}
                type="button"
                className={["source-tab", source.id === analysis.activeSourceId ? "is-active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => switchSource(source.id)}
              >
                {`Kilde ${index + 1}`}
                {source.title?.trim() ? `: ${source.title.trim()}` : ""}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="secondary-button" onClick={addSource}>
          Ny kilde
        </button>
      </section>

      {isGuideOpen ? (
        <section className="guide-card">
          <div className="guide-header">
            <div>
              <p className="panel-label">Faglig guide</p>
              <h2>Kildekritik og historiefaglige begreber</h2>
            </div>
            <p className="guide-note">
              Brug guiden som støtte under arbejdet. Den forklarer metoden og de begreber, der hører til kategorierne.
            </p>
          </div>

          <div className="guide-grid guide-grid-wide">
            {GUIDE_SECTIONS.map((section) => (
              <article key={section.title} className="guide-section">
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>

          <div className="concept-guide-list">
            {currentSource.categories.map((category) => (
              <article key={category.id} className="concept-guide-card" style={{ "--guide-accent": category.color }}>
                <div className="concept-guide-head">
                  <span className="category-dot" />
                  <h3>{category.name}</h3>
                </div>
                <p>{category.guide}</p>
                <p className="concept-label">Spørgsmål</p>
                <ul>
                  {category.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
                <p className="concept-label">Knyttede begreber</p>
                <div className="concept-tags">
                  {category.relatedConcepts.map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {isTimelineOpen ? (
        <section className="timeline-board timeline-board-top">
          <div className="timeline-board-header">
            <div>
              <p className="panel-label">Tidslinje</p>
              <h2>Byg et forløb på tværs af kilderne</h2>
              <p className="guide-note">
                Brug tidslinjen, når kronologi eller udvikling er vigtig. Markeringer fra <strong>Indhold / påstande</strong> er ofte gode kandidater, men du kan bruge alle kategorier.
              </p>
            </div>
            <div className="timeline-summary-card">
              <span>Klar til tidslinje</span>
              <strong>{timelineEntries.length}</strong>
              <small>{timelineReadyCount} med udfyldt dato eller periode</small>
            </div>
          </div>

          {timelineEntries.length ? (
            <div className="timeline-rail">
              {timelineEntries.map((entry) => (
                <article
                  key={`timeline-${entry.id}`}
                  className="timeline-event-card"
                  style={{ "--timeline-color": entry.color }}
                >
                  <div className="timeline-year-pill">
                    {entry.timeline.dateLabel.trim() ||
                      (entry.timeline.sortYear != null ? String(entry.timeline.sortYear) : "Uden tid")}
                  </div>
                  <div className="timeline-event-content">
                    <h3>{entry.timeline.title || entry.excerpt}</h3>
                    <p className="timeline-event-meta">
                      <strong>{entry.sourceTitle}</strong> · {entry.categoryName}
                    </p>
                    <p>{entry.timeline.note || entry.comment || entry.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="timeline-empty">
              <p>Ingen markeringer er sendt til tidslinjen endnu.</p>
              <p>Brug knappen <strong>Til tidslinje</strong> under en markering i analysepanelet, hvis kronologi er relevant for din analyse.</p>
            </div>
          )}
        </section>
      ) : null}

      <section className="print-sheet">
        {projectTitle ? (
          <header className="print-project-header">
            <p className="panel-label">Kildesæt</p>
            <h1>{projectTitle}</h1>
            <p>{`${analysis.sources.length} kilder`}</p>
          </header>
        ) : null}

        {analysis.sources.map((source, sourceIndex) => {
          const sourcePages = sourceDocuments[source.id] ?? [];
          const sourceOrderedAnnotations = sortAnnotationsForOutput(source.annotations);
          const sourceNumbers = new Map();
          sourceOrderedAnnotations.forEach((annotation, index) => {
            sourceNumbers.set(annotation.id, index + 1);
          });
          const sourcePrintText = splitTextForPrint(source.sourceText, source.annotations, sourceNumbers);
          const sourceRegionMap = new Map();
          const sourceTextRectMap = new Map();
          source.annotations.forEach((annotation) => {
            if (annotation.type === "region") {
              const list = sourceRegionMap.get(annotation.pageIndex) ?? [];
              list.push(annotation);
              sourceRegionMap.set(annotation.pageIndex, list);
            }
            if (annotation.type === "text" && Array.isArray(annotation.pdfRects)) {
              const list = sourceTextRectMap.get(annotation.pageIndex) ?? [];
              list.push(annotation);
              sourceTextRectMap.set(annotation.pageIndex, list);
            }
          });

          return (
            <section key={`print-source-${source.id}`} className="print-source-block">
              <header className="print-sheet-header">
                <div>
                  <p className="panel-label">{`Kilde ${sourceIndex + 1}`}</p>
                  <h2>{source.title || "Kildeanalyse"}</h2>
                  <p className="print-problem">
                    <strong>Problemstilling:</strong> {source.problemStatement || "Ingen problemstilling endnu."}
                  </p>
                </div>
              </header>

              <div className="print-layout">
                <section className="print-document">
                  <h3>Kilde</h3>
                  {source.sourceMode === "pdf" && sourcePages.length ? (
                    <div className="print-pdf-pages">
                      {sourcePages.map((page) => (
                        <article key={`print-page-${source.id}-${page.pageIndex}`} className="print-pdf-page">
                          <div className="print-page-label">Side {page.pageIndex + 1}</div>
                          <div className="print-pdf-frame">
                            <img
                              src={page.imageUrl}
                              alt={`Udskrift af PDF-side ${page.pageIndex + 1}`}
                              className="pdf-page-image"
                            />
                            <div className="region-overlay-layer">
                              {(sourceTextRectMap.get(page.pageIndex) ?? []).map((annotation) =>
                                annotation.pdfRects.map((rect, rectIndex) => (
                                  <div
                                    key={`print-text-rect-${annotation.id}-${rectIndex}`}
                                    className="text-rect-annotation print-text-rect-annotation"
                                    style={{
                                      "--highlight-color": annotation.color,
                                      left: `${rect.x * 100}%`,
                                      top: `${rect.y * 100}%`,
                                      width: `${rect.width * 100}%`,
                                      height: `${rect.height * 100}%`,
                                    }}
                                  >
                                    {rectIndex === 0 ? (
                                      <span className="print-note-badge print-note-badge-inline">
                                        {sourceNumbers.get(annotation.id)}
                                      </span>
                                    ) : null}
                                  </div>
                                )),
                              )}
                              {(sourceRegionMap.get(page.pageIndex) ?? []).map((annotation) => (
                                <div
                                  key={`print-region-${annotation.id}`}
                                  className="region-annotation print-region-annotation"
                                  style={{
                                    "--highlight-color": annotation.color,
                                    left: `${annotation.x * 100}%`,
                                    top: `${annotation.y * 100}%`,
                                    width: `${annotation.width * 100}%`,
                                    height: `${annotation.height * 100}%`,
                                  }}
                                >
                                  <span className="print-note-badge">{sourceNumbers.get(annotation.id)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="print-text-document">
                      {sourcePrintText.length ? (
                        sourcePrintText.map((segment, index) =>
                          segment.type === "annotation" ? (
                            <span
                              key={`print-text-${segment.annotation.id}-${index}`}
                              className="print-highlight"
                              style={{ "--highlight-color": segment.annotation.color }}
                            >
                              {segment.text}
                              <sup className="print-note-badge print-note-badge-inline">{segment.number}</sup>
                            </span>
                          ) : (
                            <span key={`print-plain-${index}`}>{segment.text}</span>
                          ),
                        )
                      ) : (
                        <p>Ingen kilde indsat endnu.</p>
                      )}
                    </div>
                  )}
                </section>

                <aside className="print-notes">
                  <h3>Kommentarer</h3>
                  <div className="print-note-list">
                    {sourceOrderedAnnotations.length ? (
                      sourceOrderedAnnotations.map((annotation) => {
                        const category = source.categories.find((item) => item.id === annotation.categoryId);
                        return (
                          <article
                            key={`print-note-${annotation.id}`}
                            className="print-note-card"
                            style={{ "--highlight-color": category?.color ?? "#94a3b8" }}
                          >
                            <div className="print-note-head">
                              <span className="print-note-badge">{sourceNumbers.get(annotation.id)}</span>
                              <div>
                                <strong>{category?.name ?? "Kategori"}</strong>
                                <p>{getAnnotationLabel(annotation, source.sourceText, sourceNumbers)}</p>
                              </div>
                            </div>
                            <p>{annotation.comment || "Ingen kommentar skrevet endnu."}</p>
                          </article>
                        );
                      })
                    ) : (
                      <p>Ingen markeringer endnu.</p>
                    )}
                  </div>
                </aside>
              </div>

              <section className="print-summary">
                <h3>Samlet kildekritisk analyse</h3>
                <div className="print-final-analysis">
                  <p>{source.finalAnalysis || "Ingen afsluttende analyse skrevet endnu."}</p>
                </div>
                <div className="print-summary-grid">
                  {source.categories.map((category) => (
                    <article key={`summary-${source.id}-${category.id}`} className="print-summary-card">
                      <h4 style={{ color: category.color }}>{category.name}</h4>
                      <p>{category.summary || "Ingen samlet kommentar skrevet endnu."}</p>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          );
        })}

        {timelineEntries.length ? (
          <section className="print-source-block print-timeline-block">
            <header className="print-sheet-header">
              <div>
                <p className="panel-label">På tværs af kilder</p>
                <h2>Tidslinje</h2>
                <p className="print-problem">
                  Markeringer fra flere kilder sat i rækkefølge, så udvikling, forløb og påstande kan ses samlet.
                </p>
              </div>
            </header>

            <section className="print-timeline">
              {timelineEntries.map((entry) => (
                <article
                  key={`print-timeline-${entry.id}`}
                  className="print-timeline-item"
                  style={{ "--timeline-color": entry.color }}
                >
                  <div className="print-timeline-year">
                    {entry.timeline.dateLabel.trim() ||
                      (entry.timeline.sortYear != null ? String(entry.timeline.sortYear) : "Uden tid")}
                  </div>
                  <div className="print-timeline-content">
                    <h4>{entry.timeline.title || entry.excerpt}</h4>
                    <p className="print-timeline-meta">
                      <strong>{entry.sourceTitle}</strong> · {entry.categoryName}
                    </p>
                    <p>{entry.timeline.note || entry.comment || entry.excerpt}</p>
                  </div>
                </article>
              ))}
            </section>
          </section>
        ) : null}
      </section>

      <section className="workspace">
        <main className="document-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Kildeområde</p>
              <h2>Se dokumentet og markér direkte i det</h2>
            </div>
            <div className="progress-card">
              <span>Fremdrift</span>
                <strong>{progressPercent}%</strong>
                <small>
                {coveredCategories} af {categoriesWithStats.length} kategorier er i brug
                </small>
              </div>
            </div>

          <section className="import-strip">
            <div
              className={["dropzone", isDragActive ? "is-active" : ""].join(" ")}
              onDragOver={handleDropZoneDragOver}
              onDragEnter={handleDropZoneDragEnter}
              onDragLeave={handleDropZoneDragLeave}
              onDrop={handleDropZoneDrop}
            >
              <div className="import-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsImportPanelOpen((current) => !current)}
                >
                  {isImportPanelOpen ? "Skjul import / redigering" : "Vis import / redigering"}
                </button>
                <label className="upload-button">
                  Upload tekst, DOCX eller PDF
                  <input
                    type="file"
                    accept=".txt,.md,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileImport}
                  />
                </label>
              </div>
              <div className="dropzone-copy">
                <strong>Træk en PDF, DOCX eller tekstfil ind her</strong>
                <p>Du kan også klikke og vælge en fil.</p>
              </div>
            </div>
            <p className="import-note">
              PDF med tekstlag kan markeres direkte. Scannede PDF&apos;er markeres manuelt.
            </p>
          </section>

          {isImportPanelOpen && currentSource.sourceMode === "text" ? (
            <label className="field-card source-editor">
              <span className="field-label">Indsæt eller redigér kilden</span>
              <textarea
                value={currentSource.sourceText}
                onChange={(event) => handleSourceTextChange(event.target.value)}
                placeholder="Indsæt kilden her."
                rows={8}
              />
            </label>
          ) : null}

          <div className="analysis-surface-card">
            <div className="analysis-toolbar">
              <div>
                <p className="panel-label">Aktiv kategori</p>
                <strong style={{ color: activeCategory?.color }}>{activeCategory?.name}</strong>
              </div>

              <div className="toolbar-actions">
                {currentSource.sourceMode === "pdf" ? (
                  <>
                    <button
                      type="button"
                      className={interactionMode === "select" ? "primary-button" : "secondary-button"}
                      onClick={() => setInteractionMode("select")}
                    >
                      Tekstmarkering
                    </button>
                    <button
                      type="button"
                      className={interactionMode === "draw" ? "primary-button" : "secondary-button"}
                      onClick={() => setInteractionMode("draw")}
                    >
                      Tegn markering
                    </button>
                  </>
                ) : null}

                <button type="button" className="primary-button" onClick={() => addTextAnnotationFromSelection("create")}>
                  Markér valgt tekst
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => addTextAnnotationFromSelection("replace")}
                  disabled={selectedAnnotation?.type !== "text"}
                >
                  Ret valgt markering
                </button>
              </div>
            </div>

            {currentSource.sourceMode === "pdf" && currentDocumentPages.length ? (
              <div
                ref={sourceSurfaceRef}
                className={["pdf-document-view", interactionMode === "draw" ? "is-draw-mode" : ""].join(" ")}
              >
                {currentDocumentPages.map((page) => (
                  <article
                    key={page.pageIndex}
                    className="pdf-page"
                    onMouseDown={(event) => handleRegionPointerDown(page.pageIndex, event)}
                    onMouseMove={handleRegionPointerMove}
                    onMouseUp={handleRegionPointerUp}
                  >
                    <div className="pdf-page-header">Side {page.pageIndex + 1}</div>
                    <div
                      className="pdf-page-frame"
                      data-page-frame="true"
                      data-page-index={page.pageIndex}
                      style={{
                        "--page-ratio": `${page.height / page.width}`,
                      }}
                    >
                      <img src={page.imageUrl} alt={`PDF-side ${page.pageIndex + 1}`} className="pdf-page-image" />

                      <div
                        ref={(node) => {
                          if (node) {
                            pdfTextLayerRefs.current.set(page.pageIndex, node);
                          } else {
                            pdfTextLayerRefs.current.delete(page.pageIndex);
                          }
                        }}
                        className="pdf-text-layer"
                        aria-label={`Tekstlag for side ${page.pageIndex + 1}`}
                      />

                      <div className="region-overlay-layer">
                        {(pageTextRectAnnotations.get(page.pageIndex) ?? []).map((annotation) =>
                          annotation.pdfRects.map((rect, rectIndex) => (
                            <button
                              type="button"
                              key={`${annotation.id}-rect-${rectIndex}`}
                              className={[
                                "text-rect-annotation",
                                annotation.muted ? "is-muted" : "",
                                annotation.selected ? "is-selected" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              style={{
                                "--highlight-color": annotation.color,
                                left: `${rect.x * 100}%`,
                                top: `${rect.y * 100}%`,
                                width: `${rect.width * 100}%`,
                                height: `${rect.height * 100}%`,
                              }}
                              onClick={() => {
                                setSelectedAnnotationId(annotation.id);
                                setActiveCategoryId(annotation.categoryId);
                                setOpenCategoryId(annotation.categoryId);
                              }}
                              title={annotation.categoryName}
                            />
                          )),
                        )}

                        {(pageRegionAnnotations.get(page.pageIndex) ?? []).map((annotation) => (
                          <button
                            type="button"
                            key={annotation.id}
                            className={[
                              "region-annotation",
                              annotation.muted ? "is-muted" : "",
                              annotation.selected ? "is-selected" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            style={{
                              "--highlight-color": annotation.color,
                              left: `${annotation.x * 100}%`,
                              top: `${annotation.y * 100}%`,
                              width: `${annotation.width * 100}%`,
                              height: `${annotation.height * 100}%`,
                            }}
                            onClick={() => {
                              setSelectedAnnotationId(annotation.id);
                              setActiveCategoryId(annotation.categoryId);
                              setOpenCategoryId(annotation.categoryId);
                            }}
                            title={annotation.categoryName}
                          />
                        ))}

                        {dragState?.pageIndex === page.pageIndex && currentDragRect ? (
                          <div className="region-draft" style={currentDragRect} />
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div ref={sourceSurfaceRef} className="analysis-surface" aria-label="Kildetekst til markering">
                {textSegments.length ? (
                  textSegments.map((segment, index) =>
                    segment.type === "annotation" ? (
                      <button
                        type="button"
                        key={`${segment.annotation.id}-${index}`}
                        className={[
                          "highlight-chip",
                          segment.annotation.muted ? "is-muted" : "",
                          segment.annotation.selected ? "is-selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ "--highlight-color": segment.annotation.color }}
                        onClick={() => {
                          setSelectedAnnotationId(segment.annotation.id);
                          setActiveCategoryId(segment.annotation.categoryId);
                          setOpenCategoryId(segment.annotation.categoryId);
                        }}
                        title={segment.annotation.categoryName}
                      >
                        {segment.text}
                      </button>
                    ) : (
                      <span key={`plain-${index}`}>{segment.text}</span>
                    ),
                  )
                ) : (
                  <p className="empty-state">
                    Upload en PDF eller indsæt en tekst.
                  </p>
                )}
              </div>
            )}

            <p className="status-line">
              {statusMessage ||
                "Vælg en kategori, markér i kilden, og skriv din kommentar i siden."}
            </p>
          </div>
        </main>

        <aside className="sidebar">
          <section className="category-builder">
            <div>
              <p className="panel-label">Kategorier</p>
              <h2>Analysepanel</h2>
            </div>
            <div className="category-builder-controls">
              <input
                value={draftCategoryName}
                onChange={(event) => setDraftCategoryName(event.target.value)}
                placeholder="Ny kategori"
              />
              <input
                type="color"
                value={draftCategoryColor}
                onChange={(event) => setDraftCategoryColor(event.target.value)}
                aria-label="Farve til ny kategori"
              />
              <button type="button" className="secondary-button" onClick={addCategory}>
                Tilføj
              </button>
            </div>
          </section>

          <div className="accordion-list">
            {categoriesWithStats.map((category) => {
              const isOpen = category.id === openCategoryId;
              const isActive = category.id === activeCategoryId;

              return (
                <section
                  key={category.id}
                  className={["accordion-card", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
                  style={{ "--category-color": category.color }}
                >
                  <button
                    type="button"
                    className="accordion-toggle"
                    onClick={() => {
                      setActiveCategoryId(category.id);
                      setOpenCategoryId(isOpen ? "" : category.id);
                    }}
                  >
                    <span className="category-dot" />
                    <span className="accordion-title-wrap">
                      <span className="accordion-title">{category.name}</span>
                      <span className="accordion-meta">{category.annotationCount} markeringer</span>
                    </span>
                    <span className="accordion-state">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen ? (
                    <div className="accordion-body">
                      <div className="guide-inline">
                        <p>{category.guide}</p>
                        <button
                          type="button"
                          className="guide-more-button"
                          onClick={() => toggleExpandedGuide(category.id)}
                        >
                          {expandedGuideIds.has(category.id) ? "Vis mindre" : "Se mere"}
                        </button>
                        {expandedGuideIds.has(category.id) ? (
                          <>
                            <ul>
                              {category.questions.map((question) => (
                                <li key={question}>{question}</li>
                              ))}
                            </ul>
                            <div className="concept-tags">
                              {category.relatedConcepts.map((concept) => (
                                <span key={concept}>{concept}</span>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>

                      <label className="mini-field">
                        <span>Navn</span>
                        <input
                          value={category.name}
                          onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                        />
                      </label>

                      <label className="mini-field">
                        <span>Samlet kommentar</span>
                        <textarea
                          rows={4}
                          value={category.summary}
                          onChange={(event) => updateCategory(category.id, { summary: event.target.value })}
                          placeholder="Saml dine markeringer til en større pointe om kildens brugbarhed i forhold til problemstillingen."
                        />
                      </label>

                      <div className="highlight-list">
                        {category.annotations.length ? (
                          category.annotations.map((annotation) => {
                            const isSelected = selectedAnnotationId === annotation.id;
                            const excerpt = getAnnotationLabel(
                              annotation,
                              currentSource.sourceText,
                              annotationNumbers,
                            );

                            return (
                              <article
                                key={annotation.id}
                                className={["highlight-card", isSelected ? "is-selected" : ""]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <button
                                  type="button"
                                  className="excerpt-button"
                                  onClick={() => setSelectedAnnotationId(annotation.id)}
                                >
                                  {excerpt}
                                </button>

                                <textarea
                                  rows={3}
                                  value={annotation.comment}
                                  onChange={(event) => updateAnnotationComment(annotation.id, event.target.value)}
                                  placeholder="Hvad viser denne markering, og hvordan hjælper den dig med at besvare problemstillingen?"
                                />

                                <div className="highlight-actions">
                                  <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={() => toggleAnnotationTimeline(annotation.id)}
                                  >
                                    {annotation.timeline ? "Fjern fra tidslinje" : "Til tidslinje"}
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-button"
                                    onClick={() => setSelectedAnnotationId(annotation.id)}
                                  >
                                    Vis i kilden
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-button danger"
                                    onClick={() => deleteAnnotation(annotation.id)}
                                  >
                                    Slet
                                  </button>
                                </div>

                                {annotation.timeline ? (
                                  <div className="timeline-inline-editor">
                                    <label className="mini-field">
                                      <span>Visning på tidslinje</span>
                                      <input
                                        value={annotation.timeline.title}
                                        onChange={(event) =>
                                          updateAnnotationTimeline(annotation.id, { title: event.target.value })
                                        }
                                        placeholder="Kort overskrift til tidslinjen"
                                      />
                                    </label>

                                    <div className="timeline-inline-grid">
                                      <label className="mini-field">
                                        <span>Dato / periode</span>
                                        <input
                                          value={annotation.timeline.dateLabel}
                                          onChange={(event) =>
                                            updateAnnotationTimeline(annotation.id, { dateLabel: event.target.value })
                                          }
                                          placeholder="Fx: 9. april 1940"
                                        />
                                      </label>

                                      <label className="mini-field">
                                        <span>Sorteringsår</span>
                                        <input
                                          type="number"
                                          value={annotation.timeline.sortYear}
                                          onChange={(event) =>
                                            updateAnnotationTimeline(annotation.id, { sortYear: event.target.value })
                                          }
                                          placeholder="1940"
                                        />
                                      </label>
                                    </div>

                                    <label className="mini-field">
                                      <span>Forklaring</span>
                                      <textarea
                                        rows={3}
                                        value={annotation.timeline.note}
                                        onChange={(event) =>
                                          updateAnnotationTimeline(annotation.id, { note: event.target.value })
                                        }
                                        placeholder="Skriv kort, hvorfor denne markering er vigtig i forløbet."
                                      />
                                    </label>
                                  </div>
                                ) : null}
                              </article>
                            );
                          })
                        ) : (
                          <p className="empty-side-state">
                            Ingen markeringer endnu. Vælg kategorien og markér i dokumentet.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="ghost-button danger"
                        onClick={() => deleteCategory(category.id)}
                      >
                        Slet kategori
                      </button>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <section className="category-builder final-analysis-card">
            <div>
              <p className="panel-label">Samlet analyse</p>
              <h2>Afsluttende vurdering</h2>
            </div>
            <textarea
              rows={8}
              value={currentSource.finalAnalysis}
              onChange={(event) => handleFieldChange("finalAnalysis", event.target.value)}
              placeholder="Skriv din samlede vurdering af kilden her."
            />
          </section>
        </aside>
      </section>

    </div>
  );
}

export default App;
