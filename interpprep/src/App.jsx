import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { ZETA_GLOSSARY_TERMS } from './zetaGlossary.js'

const TABS = [
  { id: 'prep', label: '준비' },
  { id: 'review', label: '복습' },
  { id: 'glossary', label: '용어집' },
]

/** Prep 연습용 용어 추천·복습→용어집 추가 시 사용하는 분류 */
const PREP_TAG_CATEGORIES = ['AI·ML', '게임플레이', '경제', 'UI·UX']
const STAR_VALUES = [1, 2, 3, 4, 5]

const INITIAL_PREP_FORM = {
  meetingName: '[Project Zeta] Logo Project Kickoff Meeting',
  date: '2026-03-27',
  time: '',
  mode: 'online',
  location: '',
  link: 'https://meet.interprep.app/q2-briefing',
  meetingHost: '',
  speakers: [],
}

const INITIAL_TOPIC_TAGS = ['Creative', 'Font discussion']

const INITIAL_GLOSSARY = ZETA_GLOSSARY_TERMS

const INITIAL_TRICKY_TERMS = [
  {
    id: 'tricky-1',
    term: 'rollout cadence',
    solution: '출시 cadence 대신 "배포 주기"로 바로 전환',
  },
  {
    id: 'tricky-2',
    term: 'soft launch cohort',
    solution: '문맥상 "소프트 런칭 사용자군"으로 풀어 전달',
  },
]

const INITIAL_MISSED_ITEMS = [
  {
    id: 'missed-1',
    original: 'We need cleaner alignment across publishing and monetization.',
    better: '퍼블리싱 팀과 수익화 팀 간 정렬을 더 명확히 맞춰야 합니다.',
  },
  {
    id: 'missed-2',
    original: 'The spike was driven by returning users, not new installs.',
    better: '이번 급증은 신규 설치보다 복귀 사용자 유입이 주된 원인이었습니다.',
  },
]

const INITIAL_IMPROVEMENTS = [
  '숫자 수치가 나올 때 한 박자 쉬고 단위를 먼저 잡기',
  '약어는 첫 등장 시 풀어 말하고 이후 약칭 유지하기',
  '질문 응답 구간에서는 문장 길이를 짧게 끊어 전달하기',
]

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[\s._·-]/g, '')
}

function formatDate(value) {
  if (!value) return '날짜 미정'

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatMeetingSchedule(date, time) {
  const datePart = formatDate(date)
  const parts = [datePart]
  if (time) parts.push(time)
  return parts.join(' · ')
}

function categoryMatchesTag(tag, category) {
  const normalizedTag = normalizeText(tag)
  const normalizedCategory = normalizeText(category)

  if (normalizedTag.includes(normalizedCategory)) return true

  if (category === 'AI·ML') {
    return ['ai', 'ml', 'model', 'llm', 'inference'].some((keyword) =>
      normalizedTag.includes(keyword),
    )
  }

  if (category === '게임플레이') {
    return ['gameplay', 'liveops', 'session', 'quest', 'balance'].some(
      (keyword) => normalizedTag.includes(keyword),
    )
  }

  if (category === '경제') {
    return ['economy', 'monetization', 'pricing', 'arppu', 'revenue'].some(
      (keyword) => normalizedTag.includes(keyword),
    )
  }

  if (category === 'UI·UX') {
    return ['ui', 'ux', 'design', 'journey', 'interaction'].some((keyword) =>
      normalizedTag.includes(keyword),
    )
  }

  return false
}

function guessCategoryFromTags(tags) {
  const matched = PREP_TAG_CATEGORIES.find((category) =>
    tags.some((tag) => categoryMatchesTag(tag, category)),
  )

  return matched ?? 'AI·ML'
}

function getRelatedCategories(tags) {
  const matches = PREP_TAG_CATEGORIES.filter((category) =>
    tags.some((tag) => categoryMatchesTag(tag, category)),
  )

  return new Set(matches)
}

function buildChecklist(form) {
  const locationTask =
    form.mode === 'offline'
      ? '장소 출입, 좌석, 마이크 배치를 확인'
      : '미팅 링크, 오디오 체크, 통역 세팅, 예비 헤드셋을 확인'

  return [
    {
      id: createId('check'),
      label: locationTask,
      checked: true,
    },
    {
      id: createId('check'),
      label: '사전에 안건, 슬라이드, 용어 자료를 확인',
      checked: true,
    },
    {
      id: createId('check'),
      label: '파트너와 연락해 발표 순서를 조율',
      checked: false,
    },
    {
      id: createId('check'),
      label: '주최자 또는 발표자에게 자료를 확인',
      checked: false,
    },
    {
      id: createId('check'),
      label: '시작 전 이름, 직함, 소속 언급을 확인',
      checked: false,
    },
  ]
}

function buildTerminology(tags, glossaryTerms) {
  const relatedCategories = getRelatedCategories(tags)
  const prioritized = glossaryTerms.filter(
    (term) => relatedCategories.size === 0 || relatedCategories.has(term.category),
  )
  const fallback = glossaryTerms.filter((term) => !prioritized.includes(term))
  const selected = [...prioritized, ...fallback].slice(0, 4)

  return selected.map((term) => ({
    id: createId('term'),
    english: term.english,
    korean: term.korean,
    notes: `선호 표현과 미팅 맥락을 확인하세요. 비고: ${term.notes ?? term.source ?? '—'}.`,
  }))
}

function buildInterpreterNote(form, tags) {
  const modeLabel = form.mode === 'offline' ? '현장 진행' : '원격 오디오 템포'
  const focusTags = tags.slice(0, 2).join(', ') || '미팅 용어'
  const speakerLine =
    form.speakers.length > 0 ? form.speakers.join(', ') : '발표자 미정'

  return [
    `발표 집중: ${speakerLine}.`,
    `${focusTags} 주변의 용어와 발표자 의도를 일관되게 유지하는 것이 우선입니다.`,
    `${modeLabel}에서 정보가 빽빽할 수 있으니 숫자, 담당, 출시 일정을 미리 명확히 하세요.`,
  ].join(' ')
}

function createPrepResult(
  form,
  tags,
  glossaryTerms,
  materialFileNames = [],
  materialUrlStrings = [],
) {
  const cleanedTags = tags.length > 0 ? tags : ['일반']
  const locationValue =
    form.mode === 'offline'
      ? form.location.trim() || '장소 미정'
      : form.link.trim() || '링크 미정'

  const speakerDisplay =
    form.speakers.length > 0 ? form.speakers.join(', ') : '발표자 미정'

  return {
    meetingName: form.meetingName.trim() || '제목 없는 미팅',
    date: form.date,
    time: form.time,
    mode: form.mode,
    locationValue,
    meetingHost: (form.meetingHost || '').trim(),
    speakers: form.speakers,
    speaker: speakerDisplay,
    materialFileNames: [...materialFileNames],
    materialUrls: [...materialUrlStrings],
    topicTags: cleanedTags,
    checklist: buildChecklist(form),
    terminology: buildTerminology(cleanedTags, glossaryTerms),
    note: buildInterpreterNote(form, cleanedTags),
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

const SPEECH_LANG_EN = 'en-US'
const SPEECH_LANG_KO = 'ko-KR'

const PRACTICE_MODES = [
  { id: 'all', label: '전체 보기' },
  { id: 'hideKo', label: '한국어 숨기기' },
  { id: 'hideEn', label: '영어 숨기기' },
]

function speakWithBrowser(text, lang) {
  const trimmed = text?.trim()
  if (
    !trimmed ||
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = lang
  window.speechSynthesis.speak(utterance)
}

function PracticeLangCell({
  text,
  lang,
  hidden,
  revealKey,
  revealedMap,
  onReveal,
}) {
  const revealed = Boolean(revealedMap[revealKey])
  const showText = !hidden || revealed
  const canSpeak = Boolean(text?.trim())

  return (
    <div className="practice-term-cell">
      <button
        type="button"
        className="practice-play-btn"
        onClick={() => speakWithBrowser(text, lang)}
        disabled={!canSpeak}
        aria-label={lang === SPEECH_LANG_EN ? '영어 읽기' : '한국어 읽기'}
      >
        <span className="practice-play-btn__icon" aria-hidden>
          ▶
        </span>
      </button>
      {showText ? (
        <span className="practice-term-text">{text}</span>
      ) : (
        <button
          type="button"
          className="reveal-pill"
          onClick={() => onReveal(revealKey)}
        >
          탭하여 표시
        </button>
      )}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('prep')
  const [prepForm, setPrepForm] = useState(INITIAL_PREP_FORM)
  const [topicInput, setTopicInput] = useState('')
  const [speakerInput, setSpeakerInput] = useState('')
  const [topicTags, setTopicTags] = useState(INITIAL_TOPIC_TAGS)
  const [materialFiles, setMaterialFiles] = useState([])
  const [materialUrls, setMaterialUrls] = useState([])
  const [materialUrlInput, setMaterialUrlInput] = useState('')
  const [dropActive, setDropActive] = useState(false)
  const fileInputRef = useRef(null)

  const [prepResult, setPrepResult] = useState(() =>
    createPrepResult(INITIAL_PREP_FORM, INITIAL_TOPIC_TAGS, INITIAL_GLOSSARY, [], []),
  )
  const [reviewScores, setReviewScores] = useState({
    fluency: 4,
    technicalAccuracy: 4,
    composure: 3,
  })
  const [trickyDraft, setTrickyDraft] = useState({ term: '', solution: '' })
  const [trickyTerms, setTrickyTerms] = useState(INITIAL_TRICKY_TERMS)
  const [missedDraft, setMissedDraft] = useState({ original: '', better: '' })
  const [missedItems, setMissedItems] = useState(INITIAL_MISSED_ITEMS)
  const [improvements, setImprovements] = useState(INITIAL_IMPROVEMENTS)
  const [improvementDraft, setImprovementDraft] = useState('')
  const [glossarySearch, setGlossarySearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('전체')
  const [glossaryTerms, setGlossaryTerms] = useState(INITIAL_GLOSSARY)
  const [draftTermCount, setDraftTermCount] = useState(1)
  const [practiceColumnMode, setPracticeColumnMode] = useState('all')
  const [practiceRevealed, setPracticeRevealed] = useState({})

  useEffect(() => {
    setPracticeRevealed({})
  }, [practiceColumnMode])

  useEffect(() => {
    setPracticeRevealed({})
  }, [prepResult.meetingName])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const revealPracticeCell = (key) => {
    setPracticeRevealed((prev) => ({ ...prev, [key]: true }))
  }

  const glossaryCategoryOptions = useMemo(() => {
    const seen = new Set()
    for (const term of glossaryTerms) {
      if (term.category) seen.add(term.category)
    }
    return ['전체', ...[...seen].sort((a, b) => a.localeCompare(b, 'ko'))]
  }, [glossaryTerms])

  const filteredGlossaryTerms = useMemo(() => {
    return glossaryTerms.filter((term) => {
      const matchesCategory =
        activeCategory === '전체' || term.category === activeCategory
      const query = glossarySearch.trim().toLowerCase()
      const noteText = (term.notes ?? term.source ?? '').toLowerCase()
      const matchesQuery =
        query === '' ||
        term.english.toLowerCase().includes(query) ||
        term.korean.toLowerCase().includes(query) ||
        (term.category ?? '').toLowerCase().includes(query) ||
        noteText.includes(query)

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, glossarySearch, glossaryTerms])

  const updatePrepField = (field, value) => {
    setPrepForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTopicKeyDown = (event) => {
    if (event.key !== 'Enter') return

    event.preventDefault()

    const nextTag = topicInput.trim()

    if (!nextTag) return

    const isDuplicate = topicTags.some(
      (tag) => tag.toLowerCase() === nextTag.toLowerCase(),
    )

    if (!isDuplicate) {
      setTopicTags((prev) => [...prev, nextTag])
    }

    setTopicInput('')
  }

  const handleSpeakerKeyDown = (event) => {
    if (event.key !== 'Enter') return

    event.preventDefault()

    const name = speakerInput.trim()

    if (!name) return

    setPrepForm((prev) => {
      const dup = prev.speakers.some(
        (n) => n.toLowerCase() === name.toLowerCase(),
      )
      if (dup) return prev
      return { ...prev, speakers: [...prev.speakers, name] }
    })
    setSpeakerInput('')
  }

  const removeSpeakerAt = (index) => {
    setPrepForm((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }))
  }

  const addMaterialFiles = (fileList) => {
    if (!fileList?.length) return

    setMaterialFiles((prev) => {
      const existing = new Set(
        prev.map(
          ({ file }) =>
            `${file.name}-${file.size}-${file.lastModified}`,
        ),
      )
      const additions = []

      for (const file of Array.from(fileList)) {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        if (existing.has(key)) continue
        existing.add(key)
        additions.push({ id: createId('file'), file })
      }

      return additions.length > 0 ? [...prev, ...additions] : prev
    })
  }

  const removeMaterialFile = (id) => {
    setMaterialFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMaterialUrlKeyDown = (event) => {
    if (event.key !== 'Enter') return

    event.preventDefault()

    const raw = materialUrlInput.trim()

    if (!raw) return

    setMaterialUrls((prev) => {
      const norm = raw.toLowerCase()
      if (prev.some((item) => item.url.toLowerCase() === norm)) return prev
      return [...prev, { id: createId('url'), url: raw }]
    })
    setMaterialUrlInput('')
  }

  const removeMaterialUrl = (id) => {
    setMaterialUrls((prev) => prev.filter((item) => item.id !== id))
  }

  const handleMaterialDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDropActive(true)
  }

  const handleMaterialDragLeave = (event) => {
    event.preventDefault()
    setDropActive(false)
  }

  const handleMaterialDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDropActive(false)
    addMaterialFiles(event.dataTransfer.files)
  }

  const handleMaterialFileInputChange = (event) => {
    addMaterialFiles(event.target.files)
    event.target.value = ''
  }

  const removeTopicTag = (tagToRemove) => {
    setTopicTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleGeneratePrep = () => {
    setPrepResult(
      createPrepResult(
        prepForm,
        topicTags,
        glossaryTerms,
        materialFiles.map(({ file }) => file.name),
        materialUrls.map(({ url }) => url),
      ),
    )
  }

  const toggleChecklistItem = (itemId) => {
    setPrepResult((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    }))
  }

  const handleScoreChange = (key, value) => {
    setReviewScores((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleAddTrickyTerm = () => {
    if (!trickyDraft.term.trim() || !trickyDraft.solution.trim()) return

    setTrickyTerms((prev) => [
      ...prev,
      {
        id: createId('tricky'),
        term: trickyDraft.term.trim(),
        solution: trickyDraft.solution.trim(),
      },
    ])
    setTrickyDraft({ term: '', solution: '' })
  }

  const handleAddMissedItem = () => {
    if (!missedDraft.original.trim() || !missedDraft.better.trim()) return

    setMissedItems((prev) => [
      ...prev,
      {
        id: createId('missed'),
        original: missedDraft.original.trim(),
        better: missedDraft.better.trim(),
      },
    ])
    setMissedDraft({ original: '', better: '' })
  }

  const updateImprovement = (index, value) => {
    setImprovements((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  const handleAddImprovement = () => {
    const nextImprovement = improvementDraft.trim()

    if (!nextImprovement) return

    setImprovements((prev) => [...prev, nextImprovement])
    setImprovementDraft('')
  }

  const handleAddToGlossary = () => {
    const category = guessCategoryFromTags(topicTags)
    const newTerms = trickyTerms
      .filter((item) => item.term.trim())
      .map((item) => ({
        id: createId('glossary'),
        english: item.term.trim(),
        korean: item.solution.trim(),
        category,
        notes: prepResult.meetingName,
      }))

    setGlossaryTerms((prev) => {
      const existingEnglish = new Set(prev.map((item) => item.english.toLowerCase()))
      const additions = newTerms.filter(
        (item) => !existingEnglish.has(item.english.toLowerCase()),
      )

      return additions.length > 0 ? [...additions, ...prev] : prev
    })

    setActiveCategory('전체')
    setActiveTab('glossary')
  }

  const handleApplyToNextPrep = () => {
    const carryOverLines = [
      ...trickyTerms.slice(0, 2).map((item) => `${item.term}: ${item.solution}`),
      ...missedItems.slice(0, 2).map((item) => `더 나은 표현: ${item.better}`),
      ...improvements.filter((item) => item.trim()),
    ]

    if (carryOverLines.length > 0) {
      setPrepResult((prev) => {
        const mergedTerminology = [
          ...trickyTerms.slice(0, 2).map((item) => ({
            id: createId('carry-term'),
            english: item.term,
            korean: '복습 필요',
            notes: item.solution,
          })),
          ...prev.terminology,
        ].filter(
          (term, index, list) =>
            list.findIndex((candidate) => candidate.english === term.english) === index,
        )

        return {
          ...prev,
          note: `${prev.note} 다음 준비로 이어가기: ${carryOverLines.join(' | ')}`,
          terminology: mergedTerminology.slice(0, 6),
        }
      })
    }

    setActiveTab('prep')
  }

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank', 'width=960,height=720')

    if (!printWindow) return

    const checklistMarkup = prepResult.checklist
      .map(
        (item) =>
          `<li style="margin: 0 0 10px 0;">${item.checked ? '☑' : '☐'} ${escapeHtml(item.label)}</li>`,
      )
      .join('')

    const terminologyMarkup = prepResult.terminology
      .map(
        (term) => `
          <tr>
            <td style="padding: 10px; border: 1px solid #e6e8ef;">${escapeHtml(term.english)}</td>
            <td style="padding: 10px; border: 1px solid #e6e8ef;">${escapeHtml(term.korean)}</td>
            <td style="padding: 10px; border: 1px solid #e6e8ef;">${escapeHtml(term.notes)}</td>
          </tr>`,
      )
      .join('')

    printWindow.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(prepResult.meetingName)} - INTERPREP</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 32px; color: #1f2937;">
          <h1 style="margin-bottom: 8px;">${escapeHtml(prepResult.meetingName)}</h1>
          <p style="margin: 0 0 24px 0; color: #4b5563;">
            ${escapeHtml(formatMeetingSchedule(prepResult.date, prepResult.time))} | ${escapeHtml(prepResult.speaker)} | ${escapeHtml(prepResult.locationValue)}
          </p>
          ${
            prepResult.meetingHost?.trim()
              ? `<p style="margin: -16px 0 24px 0; color: #4b5563;"><strong>줌 생성자:</strong> ${escapeHtml(prepResult.meetingHost.trim())}</p>`
              : ''
          }
          ${
            (prepResult.materialFileNames?.length || prepResult.materialUrls?.length)
              ? `<p style="margin: 0 0 24px 0; color: #4b5563;"><strong>자료:</strong> ${[
                  ...(prepResult.materialFileNames || []),
                  ...(prepResult.materialUrls || []),
                ]
                  .map((n) => escapeHtml(String(n)))
                  .join(', ')}</p>`
              : ''
          }
          <h2 style="margin: 0 0 12px 0;">사전 체크리스트</h2>
          <ul style="padding-left: 20px; margin: 0 0 24px 0;">${checklistMarkup}</ul>
          <h2 style="margin: 0 0 12px 0;">연습 모드</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr>
                <th style="padding: 10px; border: 1px solid #e6e8ef; text-align: left;">영어</th>
                <th style="padding: 10px; border: 1px solid #e6e8ef; text-align: left;">한국어</th>
                <th style="padding: 10px; border: 1px solid #e6e8ef; text-align: left;">비고</th>
              </tr>
            </thead>
            <tbody>${terminologyMarkup}</tbody>
          </table>
          <h2 style="margin: 0 0 12px 0;">통역사 노트</h2>
          <p style="line-height: 1.6;">${escapeHtml(prepResult.note)}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleExportCsv = () => {
    const rows = [
      ['영어', '한국어', '분류', '비고'],
      ...filteredGlossaryTerms.map((term) => [
        term.english,
        term.korean,
        term.category,
        term.notes ?? term.source ?? '',
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    downloadFile(csv, 'interprep-glossary.csv', 'text/csv;charset=utf-8')
  }

  const handleAddDraftGlossaryTerm = () => {
    const nextCategory =
      activeCategory === '전체' ? guessCategoryFromTags(topicTags) : activeCategory

    setGlossaryTerms((prev) => [
      {
        id: createId('glossary'),
        english: `new term ${draftTermCount}`,
        korean: `새 용어 ${draftTermCount}`,
        category: nextCategory,
        notes: '수동 입력',
      },
      ...prev,
    ])
    setDraftTermCount((prev) => prev + 1)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" aria-hidden />
          <span className="brand-text">INTERPREP</span>
        </div>
        <nav className="top-tabs" role="tablist" aria-label="주요 메뉴">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={`top-tab ${activeTab === tab.id ? 'top-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="workspace">
        {activeTab === 'prep' && (
          <section className="tab-panel" role="tabpanel" aria-labelledby="tab-prep">
            <div className="prep-layout">
              <form className="card sidebar-card" onSubmit={(e) => e.preventDefault()}>
                <div className="section-heading">
                  <p className="eyebrow">준비 입력</p>
                  <h2>미팅 설정</h2>
                </div>

                <label className="field">
                  <span className="field-label">미팅 이름</span>
                  <input
                    type="text"
                    className="field-input"
                    value={prepForm.meetingName}
                    onChange={(event) =>
                      updatePrepField('meetingName', event.target.value)
                    }
                    placeholder="예: 분기 실적 브리핑"
                  />
                </label>

                <div className="field">
                  <span className="field-label">날짜 · 시간</span>
                  <div className="datetime-row">
                    <label className="field field--datetime">
                      <span className="field-label field-label--nested">날짜</span>
                      <input
                        type="date"
                        className="field-input"
                        value={prepForm.date}
                        onChange={(event) =>
                          updatePrepField('date', event.target.value)
                        }
                      />
                    </label>
                    <label className="field field--datetime">
                      <span className="field-label field-label--nested">시간</span>
                      <input
                        type="time"
                        className="field-input"
                        value={prepForm.time}
                        onChange={(event) =>
                          updatePrepField('time', event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="field">
                  <span className="field-label">미팅 방식</span>
                  <div className="segmented-control">
                    {['offline', 'online'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`segmented-button ${prepForm.mode === mode ? 'segmented-button--active' : ''}`}
                        onClick={() => updatePrepField('mode', mode)}
                      >
                        {mode === 'offline' ? '오프라인' : '온라인'}
                      </button>
                    ))}
                  </div>
                </div>

                {prepForm.mode === 'offline' ? (
                  <label className="field">
                    <span className="field-label">장소</span>
                    <input
                      type="text"
                      className="field-input"
                      value={prepForm.location}
                      onChange={(event) =>
                        updatePrepField('location', event.target.value)
                      }
                      placeholder="예: 본사 5층 보드룸"
                    />
                  </label>
                ) : (
                  <>
                    <label className="field">
                      <span className="field-label">링크</span>
                      <input
                        type="url"
                        className="field-input"
                        value={prepForm.link}
                        onChange={(event) =>
                          updatePrepField('link', event.target.value)
                        }
                        placeholder="https://"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">줌 생성자</span>
                      <input
                        type="text"
                        className="field-input"
                        value={prepForm.meetingHost}
                        onChange={(event) =>
                          updatePrepField('meetingHost', event.target.value)
                        }
                        placeholder="이름 또는 이메일"
                        autoComplete="off"
                      />
                    </label>
                  </>
                )}

                <div className="field field--speakers-materials">
                  <span className="field-label">발표자 및 자료</span>

                  <span className="field-label field-label--nested">발표자</span>
                  <input
                    type="text"
                    className="field-input"
                    value={speakerInput}
                    onChange={(event) => setSpeakerInput(event.target.value)}
                    onKeyDown={handleSpeakerKeyDown}
                    placeholder="이름 입력 후 Enter — 목록에 추가됨"
                    autoComplete="off"
                  />
                  {prepForm.speakers.length > 0 && (
                    <div className="speaker-list-wrap">
                      <ul className="speaker-list" aria-label="발표자">
                        {prepForm.speakers.map((name, index) => (
                          <li
                            key={`${name}-${index}`}
                            className="speaker-list__item"
                          >
                            <span className="speaker-list__bullet" aria-hidden>
                              •
                            </span>
                            <span className="speaker-list__name">{name}</span>
                            <button
                              type="button"
                              className="speaker-list__remove"
                              onClick={() => removeSpeakerAt(index)}
                            >
                              삭제
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input-hidden"
                    multiple
                    onChange={handleMaterialFileInputChange}
                    aria-hidden
                    tabIndex={-1}
                  />

                  <button
                    type="button"
                    className={`drop-zone drop-zone--after-speakers ${dropActive ? 'drop-zone--active' : ''}`}
                    aria-label="자료 업로드. 파일을 여기로 드래그하거나 클릭해 선택하세요."
                    onClick={() => fileInputRef.current?.click()}
                    onDragLeave={handleMaterialDragLeave}
                    onDragOver={handleMaterialDragOver}
                    onDrop={handleMaterialDrop}
                  >
                    <span className="drop-zone__icon" aria-hidden>
                      ↑
                    </span>
                    <span className="drop-zone__text">
                      파일을 드래그하거나 클릭해서 업로드
                    </span>
                    <span className="drop-zone__hint">PDF, 슬라이드, 덱 등</span>
                  </button>

                  {materialFiles.length > 0 && (
                    <ul className="material-file-list" aria-label="업로드된 파일">
                      {materialFiles.map(({ id, file }) => (
                        <li key={id} className="material-file-list__item">
                          <span className="material-file-list__name" title={file.name}>
                            {file.name}
                          </span>
                          <button
                            type="button"
                            className="material-file-list__remove"
                            onClick={() => removeMaterialFile(id)}
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <label className="field field--material-url">
                    <span className="field-label field-label--nested field-label--spaced">
                      URL 추가 (슬라이드, 문서, 참고자료…)
                    </span>
                    <input
                      type="text"
                      className="field-input"
                      inputMode="url"
                      value={materialUrlInput}
                      onChange={(event) =>
                        setMaterialUrlInput(event.target.value)
                      }
                      onKeyDown={handleMaterialUrlKeyDown}
                      placeholder="링크 붙여넣기 후 Enter"
                      autoComplete="off"
                    />
                  </label>

                  {materialUrls.length > 0 && (
                    <ul className="material-file-list" aria-label="자료 링크">
                      {materialUrls.map(({ id, url }) => (
                        <li key={id} className="material-file-list__item">
                          <a
                            className="material-file-list__link"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={url}
                          >
                            {url}
                          </a>
                          <button
                            type="button"
                            className="material-file-list__remove"
                            onClick={() => removeMaterialUrl(id)}
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="field">
                  <span className="field-label">주제 태그</span>
                  <input
                    type="text"
                    className="field-input"
                    value={topicInput}
                    onChange={(event) => setTopicInput(event.target.value)}
                    onKeyDown={handleTopicKeyDown}
                    placeholder="텍스트 입력 후 Enter"
                  />
                </label>

                <div className="tag-list">
                  {topicTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="tag-pill"
                      onClick={() => removeTopicTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="stack-actions">
                  <button
                    type="button"
                    className="button button--primary button--full"
                    onClick={handleGeneratePrep}
                  >
                    준비 노트 생성
                  </button>
                </div>
              </form>

              <section className="card result-card">
                <div className="result-header">
                  <div>
                    <p className="eyebrow">준비 노트</p>
                    <h2>{prepResult.meetingName}</h2>
                  </div>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleExportPdf}
                  >
                    PDF보내기
                  </button>
                </div>

                <div className="meta-row meta-row--schedule">
                  <span className="meta-pill">
                    {formatMeetingSchedule(prepResult.date, prepResult.time)}
                  </span>
                  <span className="meta-pill">
                    {prepResult.mode === 'offline' ? '오프라인' : '온라인'}
                  </span>
                  <span className="meta-pill">{prepResult.locationValue}</span>
                  {prepResult.mode === 'online' &&
                    prepResult.meetingHost?.trim() && (
                      <span className="meta-pill">
                        줌 생성자: {prepResult.meetingHost}
                      </span>
                    )}
                </div>

                <div className="meta-speakers-block">
                  <span className="meta-speakers-label">발표자</span>
                  {prepResult.speakers.length === 0 ? (
                    <p className="meta-speakers-empty">발표자 미정</p>
                  ) : (
                    <ul className="speaker-preview-list">
                      {prepResult.speakers.map((name, index) => (
                        <li key={`${name}-${index}`} className="speaker-preview-list__item">
                          <span className="speaker-preview-list__bullet" aria-hidden>
                            •
                          </span>
                          <span className="speaker-preview-list__name">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {(prepResult.materialFileNames?.length > 0 ||
                  prepResult.materialUrls?.length > 0) && (
                  <div className="meta-materials-block">
                    <span className="meta-speakers-label">자료</span>
                    <ul className="material-preview-list">
                      {prepResult.materialFileNames.map((name, index) => (
                        <li
                          key={`file-${name}-${index}`}
                          className="material-preview-list__item"
                        >
                          <span className="material-preview-list__bullet" aria-hidden>
                            •
                          </span>
                          <span className="material-preview-list__name">{name}</span>
                        </li>
                      ))}
                      {(prepResult.materialUrls || []).map((url, index) => (
                        <li
                          key={`url-${url}-${index}`}
                          className="material-preview-list__item"
                        >
                          <span className="material-preview-list__bullet" aria-hidden>
                            •
                          </span>
                          <a
                            className="material-preview-list__link"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="tag-list">
                  {prepResult.topicTags.map((tag) => (
                    <span key={tag} className="tag-pill tag-pill--static">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="content-grid">
                  <section className="content-block content-block--full">
                    <div className="block-header">
                      <h3>사전 체크리스트</h3>
                    </div>
                    <div className="checklist">
                      {prepResult.checklist.map((item) => (
                        <label key={item.id} className="check-item">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleChecklistItem(item.id)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="content-block content-block--full">
                    <div className="block-header block-header--practice">
                      <h3>연습 모드</h3>
                      <div
                        className="practice-toggles"
                        role="group"
                        aria-label="연습 모드 열 표시"
                      >
                        {PRACTICE_MODES.map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            className={`practice-toggle ${practiceColumnMode === id ? 'practice-toggle--active' : ''}`}
                            aria-pressed={practiceColumnMode === id}
                            onClick={() => setPracticeColumnMode(id)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="table-shell">
                      <table className="data-table data-table--practice">
                        <thead>
                          <tr>
                            <th>영어</th>
                            <th>한국어</th>
                            <th>비고</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prepResult.terminology.map((term) => (
                            <tr key={term.id}>
                              <td>
                                <PracticeLangCell
                                  text={term.english}
                                  lang={SPEECH_LANG_EN}
                                  hidden={practiceColumnMode === 'hideEn'}
                                  revealKey={`${term.id}-en`}
                                  revealedMap={practiceRevealed}
                                  onReveal={revealPracticeCell}
                                />
                              </td>
                              <td>
                                <PracticeLangCell
                                  text={term.korean}
                                  lang={SPEECH_LANG_KO}
                                  hidden={practiceColumnMode === 'hideKo'}
                                  revealKey={`${term.id}-ko`}
                                  revealedMap={practiceRevealed}
                                  onReveal={revealPracticeCell}
                                />
                              </td>
                              <td className="data-table__notes-cell">
                                {term.notes}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="block-header block-header--note-follow">
                      <h3>통역사 노트</h3>
                    </div>
                    <div className="note-box">{prepResult.note}</div>
                  </section>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === 'review' && (
          <section className="tab-panel" role="tabpanel" aria-labelledby="tab-review">
            <div className="card review-card">
              <div className="section-heading section-heading--inline">
                <div>
                  <p className="eyebrow">세션 후 복습</p>
                  <h2>{prepResult.meetingName}</h2>
                </div>
                <span className="meta-pill">
                  {formatMeetingSchedule(prepResult.date, prepResult.time)}
                </span>
              </div>

              <section className="content-block">
                <div className="block-header">
                  <h3>자기 평가</h3>
                </div>
                <div className="rating-list">
                  {[
                    ['fluency', '유창성'],
                    ['technicalAccuracy', '전문 정확도'],
                    ['composure', '침착성'],
                  ].map(([key, label]) => (
                    <div key={key} className="rating-row">
                      <span>{label}</span>
                      <div className="star-row">
                        {STAR_VALUES.map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`star-button ${reviewScores[key] >= value ? 'star-button--active' : ''}`}
                            onClick={() => handleScoreChange(key, value)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="content-block">
                <div className="block-header">
                  <h3>까다로운 용어</h3>
                </div>
                <div className="entry-form">
                  <input
                    type="text"
                    className="field-input"
                    value={trickyDraft.term}
                    onChange={(event) =>
                      setTrickyDraft((prev) => ({
                        ...prev,
                        term: event.target.value,
                      }))
                    }
                    placeholder="어려웠던 용어"
                  />
                  <input
                    type="text"
                    className="field-input"
                    value={trickyDraft.solution}
                    onChange={(event) =>
                      setTrickyDraft((prev) => ({
                        ...prev,
                        solution: event.target.value,
                      }))
                    }
                    placeholder="즉석 해결책"
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleAddTrickyTerm}
                  >
                    + 추가
                  </button>
                </div>
                <div className="entry-list">
                  {trickyTerms.map((item) => (
                    <article key={item.id} className="entry-card">
                      <strong>{item.term}</strong>
                      <p>{item.solution}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-block">
                <div className="block-header">
                  <h3>놓침·오역</h3>
                </div>
                <div className="entry-form">
                  <textarea
                    className="field-input field-input--textarea"
                    value={missedDraft.original}
                    onChange={(event) =>
                      setMissedDraft((prev) => ({
                        ...prev,
                        original: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="놓친 문장"
                  />
                  <textarea
                    className="field-input field-input--textarea"
                    value={missedDraft.better}
                    onChange={(event) =>
                      setMissedDraft((prev) => ({
                        ...prev,
                        better: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="더 나은 표현"
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleAddMissedItem}
                  >
                    + 추가
                  </button>
                </div>
                <div className="entry-list">
                  {missedItems.map((item) => (
                    <article key={item.id} className="entry-card">
                      <strong>{item.original}</strong>
                      <p>{item.better}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="content-block">
                <div className="block-header">
                  <h3>다음에 개선할 점</h3>
                </div>
                <div className="improvement-list">
                  {improvements.map((item, index) => (
                    <textarea
                      key={`${index}-${item}`}
                      className="field-input field-input--textarea"
                      rows={2}
                      value={item}
                      onChange={(event) => updateImprovement(index, event.target.value)}
                    />
                  ))}
                </div>
                <div className="entry-form entry-form--single">
                  <input
                    type="text"
                    className="field-input"
                    value={improvementDraft}
                    onChange={(event) => setImprovementDraft(event.target.value)}
                    placeholder="개선점 메모 추가"
                  />
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleAddImprovement}
                  >
                    + 추가
                  </button>
                </div>
              </section>

              <div className="footer-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleAddToGlossary}
                >
                  용어집에 추가
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleApplyToNextPrep}
                >
                  다음 준비에 반영
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'glossary' && (
          <section className="tab-panel" role="tabpanel" aria-labelledby="tab-glossary">
            <div className="card glossary-card">
              <div className="section-heading">
                <p className="eyebrow">공유 용어</p>
                <h2>용어집</h2>
              </div>

              <div className="glossary-toolbar">
                <input
                  type="search"
                  className="field-input search-input"
                  value={glossarySearch}
                  onChange={(event) => setGlossarySearch(event.target.value)}
                  placeholder="용어 검색"
                />
                <div className="chip-row">
                  {glossaryCategoryOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`chip ${activeCategory === category ? 'chip--active' : ''}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>영어</th>
                      <th>한국어</th>
                      <th>분류</th>
                      <th>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGlossaryTerms.length > 0 ? (
                      filteredGlossaryTerms.map((term) => (
                        <tr key={term.id}>
                          <td>{term.english}</td>
                          <td>{term.korean}</td>
                          <td>{term.category}</td>
                          <td>{term.notes ?? term.source ?? ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-state">
                          조건에 맞는 용어가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="footer-actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleAddDraftGlossaryTerm}
                >
                  + 용어 추가
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleExportCsv}
                >
                  CSV보내기
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
