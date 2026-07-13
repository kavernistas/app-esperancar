import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, CheckCircle, ChevronRight, ChevronLeft, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AGE_RANGES = ["16-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const EDUCATION = [
  { value: "sem_escolaridade", label: "Sem escolaridade formal" },
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "superior", label: "Ensino Superior" },
  { value: "pos_graduacao", label: "Pós-graduação" },
];
const RELIGIONS = [
  { value: "catolica", label: "Católica" },
  { value: "evangelica", label: "Evangélica" },
  { value: "matriz_africana", label: "Matriz Africana" },
  { value: "espirita", label: "Espírita" },
  { value: "sem_religiao", label: "Sem religião" },
  { value: "outra", label: "Outra" },
];

export default function SurveyRunner({ surveys, user, onSaveResponse }) {
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [step, setStep] = useState("select"); // select | profile | questions | review | done
  const [qIndex, setQIndex] = useState(0);
  const [profile, setProfile] = useState({});
  const [answers, setAnswers] = useState({});
  const [geo, setGeo] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  const sortedQuestions = (selectedSurvey?.questions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  const captureGPS = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const startInterview = () => {
    if (!selectedSurvey) return;
    setStartTime(new Date().toISOString());
    captureGPS();
    setStep("profile");
    setProfile({});
    setAnswers({});
    setQIndex(0);
    setOfflineSaved(false);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToNext = () => {
    const currentQ = sortedQuestions[qIndex];
    const currentAnswer = answers[currentQ.id];

    // Check branching
    let nextIdx = qIndex + 1;
    if (currentQ.branch_logic?.conditions) {
      const cond = currentQ.branch_logic.conditions.find(c => c.if_answer === currentAnswer);
      if (cond) {
        const skipIdx = sortedQuestions.findIndex(q => q.id === cond.skip_to);
        if (skipIdx !== -1) nextIdx = skipIdx;
      }
    }

    if (nextIdx >= sortedQuestions.length) {
      setStep("review");
    } else {
      setQIndex(nextIdx);
    }
  };

  const goToPrev = () => {
    if (qIndex > 0) setQIndex(qIndex - 1);
    else setStep("profile");
  };

  const submit = async () => {
    setSubmitting(true);
    const endTime = new Date().toISOString();
    const duration = startTime ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 0;

    // Quality flags
    const flags = [];
    const minExpected = sortedQuestions.length * 8;
    if (duration < minExpected) flags.push("fast_completion");

    // Build response
    const response = {
      survey_id: selectedSurveyId,
      survey_title: selectedSurvey?.title || "",
      interviewer_id: user?.id,
      interviewer_name: user?.full_name || user?.email || "",
      respondent_profile: profile,
      responses: sortedQuestions.map(q => ({
        question_id: q.id,
        question_text: q.text,
        answer: answers[q.id] || "",
        sociological_axis: q.sociological_axis,
      })),
      geo_lat: geo?.lat,
      geo_lng: geo?.lng,
      timestamp_start: startTime,
      timestamp_end: endTime,
      duration_seconds: duration,
      status: flags.length > 0 ? "flagged" : "synced",
      quality_flags: flags,
      vote_intention: answers[sortedQuestions.find(q => q.sociological_axis === "vote_intention")?.id] || "",
      sentiment_markers: (() => {
        const markers = {};
        const sentimentQs = sortedQuestions.filter(q => q.sociological_axis === "sentiment");
        sentimentQs.forEach(q => {
          if (q.text) {
            const lower = q.text.toLowerCase();
            if (lower.includes("medo")) markers.medo = parseInt(answers[q.id]) || 0;
            if (lower.includes("esperan")) markers.esperanca = parseInt(answers[q.id]) || 0;
            if (lower.includes("ressent")) markers.ressentimento = parseInt(answers[q.id]) || 0;
            if (lower.includes("indign")) markers.indignacao = parseInt(answers[q.id]) || 0;
          }
        });
        return markers;
      })(),
    };

    const success = await onSaveResponse(response);
    setSubmitting(false);
    setStep("done");
    setOfflineSaved(!success);
  };

  // Step: Select survey
  if (step === "select") {
    const activeSurveys = surveys.filter(s => s.status === "active");
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="text-lg font-semibold text-[#0A2540] mb-1">Coleta de Campo</h2>
        <p className="text-sm text-slate-500 mb-4">Selecione uma pesquisa ativa para iniciar a entrevista</p>
        {activeSurveys.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">Nenhuma pesquisa ativa disponível</div>
        ) : (
          <div className="space-y-2">
            {activeSurveys.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSurveyId(s.id); }}
                className={`w-full text-left p-4 rounded-xl border transition ${selectedSurveyId === s.id ? "border-[#7AC943] bg-[#7AC943]/5" : "border-slate-200 hover:bg-slate-50"}`}
              >
                <p className="font-medium text-sm text-[#0A2540]">{s.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.questions?.length || 0} perguntas • Amostra alvo: {s.target_sample_size || "N/A"}</p>
              </button>
            ))}
          </div>
        )}
        {selectedSurveyId && (
          <Button onClick={startInterview} className="bg-[#7AC943] hover:bg-[#5DA830] mt-4 w-full">Iniciar Entrevista</Button>
        )}
      </div>
    );
  }

  // Step: Done
  if (step === "done") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
        {offlineSaved ? (
          <>
            <WifiOff className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#0A2540]">Resposta salva offline</h3>
            <p className="text-sm text-slate-500 mt-1">A resposta foi armazenada localmente e será sincronizada quando houver conexão.</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-12 h-12 text-[#7AC943] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#0A2540]">Entrevista registrada!</h3>
            <p className="text-sm text-slate-500 mt-1">Resposta sincronizada com sucesso.</p>
          </>
        )}
        <Button onClick={() => setStep("select")} variant="outline" className="mt-4">Nova Entrevista</Button>
      </div>
    );
  }

  // Step: Profile
  if (step === "profile") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[#7AC943]" />
          <span className="text-xs text-slate-400">{geo ? `GPS: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : "Capturando GPS..."}</span>
          <Clock className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs text-slate-400">Iniciada em {startTime ? new Date(startTime).toLocaleTimeString("pt-BR") : ""}</span>
        </div>
        <h2 className="text-lg font-semibold text-[#0A2540] mb-1">Perfil Sociológico do Entrevistado</h2>
        <p className="text-sm text-slate-500 mb-4">Segmentação por capital cultural, inserção religiosa e redes de sociabilidade</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Faixa Etária</Label>
            <Select value={profile.age_range || "_none_"} onValueChange={v => setProfile(p => ({ ...p, age_range: v === "_none_" ? "" : v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="z-[1100]">{AGE_RANGES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Gênero</Label>
            <Select value={profile.gender || "_none_"} onValueChange={v => setProfile(p => ({ ...p, gender: v === "_none_" ? "" : v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="z-[1100]">
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Escolaridade</Label>
            <Select value={profile.education || "_none_"} onValueChange={v => setProfile(p => ({ ...p, education: v === "_none_" ? "" : v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="z-[1100]">{EDUCATION.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Inserção Religiosa</Label>
            <Select value={profile.religion || "_none_"} onValueChange={v => setProfile(p => ({ ...p, religion: v === "_none_" ? "" : v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="z-[1100]">{RELIGIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bairro</Label>
            <Input value={profile.neighborhood || ""} onChange={e => setProfile(p => ({ ...p, neighborhood: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Cidade</Label>
            <Input value={profile.city || ""} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} className="mt-1" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={profile.has_internet || false} onChange={e => setProfile(p => ({ ...p, has_internet: e.target.checked }))} /> Tem internet em casa
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={profile.has_sanitation || false} onChange={e => setProfile(p => ({ ...p, has_sanitation: e.target.checked }))} /> Tem saneamento básico
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => setStep("questions")} className="bg-[#7AC943] hover:bg-[#5DA830]">Iniciar Questionário <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    );
  }

  // Step: Questions
  if (step === "questions" && sortedQuestions.length > 0) {
    const q = sortedQuestions[qIndex];
    const currentAnswer = answers[q.id] || "";
    const isLast = qIndex === sortedQuestions.length - 1;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#7AC943]">Pergunta {qIndex + 1} de {sortedQuestions.length}</span>
          <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full ml-3">
            <div className="h-full bg-[#7AC943] rounded-full transition-all" style={{ width: `${((qIndex + 1) / sortedQuestions.length) * 100}%` }} />
          </div>
        </div>

        <h3 className="text-base font-semibold text-[#0A2540] mb-4">{q.text}</h3>

        {q.type === "multiple_choice" && (q.options || []).map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(q.id, opt)}
            className={`w-full text-left p-3 rounded-xl border mb-2 transition text-sm ${currentAnswer === opt ? "border-[#7AC943] bg-[#7AC943]/5" : "border-slate-200 hover:bg-slate-50"}`}
          >
            {opt}
          </button>
        ))}

        {q.type === "yes_no" && ["Sim", "Não"].map(opt => (
          <button
            key={opt}
            onClick={() => handleAnswer(q.id, opt)}
            className={`w-full text-left p-3 rounded-xl border mb-2 transition text-sm ${currentAnswer === opt ? "border-[#7AC943] bg-[#7AC943]/5" : "border-slate-200 hover:bg-slate-50"}`}
          >
            {opt}
          </button>
        ))}

        {q.type === "likert" && (
          <div className="flex gap-2 justify-between">
            {Array.from({ length: (q.scale_max || 5) - (q.scale_min || 1) + 1 }, (_, i) => {
              const val = (q.scale_min || 1) + i;
              return (
                <button
                  key={val}
                  onClick={() => handleAnswer(q.id, String(val))}
                  className={`flex-1 py-3 rounded-xl border text-center text-sm font-medium transition ${currentAnswer === String(val) ? "border-[#7AC943] bg-[#7AC943] text-white" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "scale" && (
          <input type="range" min={q.scale_min || 1} max={q.scale_max || 10} value={parseInt(currentAnswer) || q.scale_min || 1} onChange={e => handleAnswer(q.id, String(e.target.value))} className="w-full" />
        )}

        {q.type === "open" && (
          <Textarea value={currentAnswer} onChange={e => handleAnswer(q.id, e.target.value)} placeholder="Resposta do entrevistado..." rows={4} />
        )}

        {q.type === "audio" && (
          <div className="text-center py-6 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500">Gravação de áudio com consentimento do entrevistado</p>
            <p className="text-xs text-slate-400 mt-1">Funcionalidade disponível no app móvel</p>
            <Textarea value={currentAnswer} onChange={e => handleAnswer(q.id, e.target.value)} placeholder="Ou registre a resposta em texto..." rows={3} className="mt-3" />
          </div>
        )}

        <div className="flex justify-between mt-5">
          <Button variant="outline" onClick={goToPrev}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
          <Button onClick={goToNext} disabled={q.required && !currentAnswer} className="bg-[#7AC943] hover:bg-[#5DA830]">
            {isLast ? "Revisar" : "Próxima"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Step: Review
  if (step === "review") {
    const duration = startTime ? Math.round((Date.now() - new Date(startTime).getTime()) / 1000) : 0;
    const answeredCount = Object.keys(answers).length;
    const isFast = duration < sortedQuestions.length * 8;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="text-lg font-semibold text-[#0A2540] mb-4">Revisão da Entrevista</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Duração</p>
            <p className="text-lg font-bold text-[#0A2540]">{Math.floor(duration / 60)}m {duration % 60}s</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <CheckCircle className="w-5 h-5 text-[#7AC943] mx-auto mb-1" />
            <p className="text-xs text-slate-400">Respondidas</p>
            <p className="text-lg font-bold text-[#0A2540]">{answeredCount}/{sortedQuestions.length}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <MapPin className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">GPS</p>
            <p className="text-sm font-bold text-[#0A2540]">{geo ? "Capturado" : "Indisp."}</p>
          </div>
        </div>

        {isFast && (
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Tempo de preenchimento abaixo do esperado. Esta resposta será marcada para auditoria.</p>
          </div>
        )}

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {sortedQuestions.map((q, idx) => (
            <div key={q.id} className="text-xs">
              <span className="font-medium text-slate-600">Q{idx + 1}: {q.text}</span>
              <p className="text-slate-400 ml-3">→ {answers[q.id] || <span className="italic text-slate-300">Sem resposta</span>}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => { setQIndex(0); setStep("questions"); }}>Revisar Respostas</Button>
          <Button onClick={submit} disabled={submitting} className="bg-[#7AC943] hover:bg-[#5DA830]">
            {submitting ? "Enviando..." : "Finalizar Entrevista"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}