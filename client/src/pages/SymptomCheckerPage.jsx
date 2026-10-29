import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, ClipboardList, Info, Phone, RefreshCw, Siren, Stethoscope } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { Select, Textarea } from '../components/ui/FormField.jsx';
import { Card, Container } from '../components/ui/Misc.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { symptomService } from '../services/index.js';
import { CATEGORY_META } from '../utils/facility.js';
import { cn } from '../utils/cn.js';

const URGENCY = {
  emergency: { label: 'Possible emergency — seek help now', tone: 'border-red-300 bg-red-50 text-red-900', icon: Siren },
  see_doctor: { label: 'Consider seeing a doctor soon', tone: 'border-amber-300 bg-amber-50 text-amber-900', icon: Stethoscope },
  monitor: { label: 'General information — monitor your symptoms', tone: 'border-brand-200 bg-brand-50 text-brand-900', icon: Info },
  information: { label: 'General information', tone: 'border-slate-200 bg-slate-50 text-slate-800', icon: Info },
};

function CheckboxPill({ checked, onChange, label, danger }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500',
        checked
          ? danger
            ? 'border-red-400 bg-red-50 text-red-900'
            : 'border-brand-500 bg-brand-50 text-brand-900'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300" />
      <span>{label}</span>
    </label>
  );
}

export default function SymptomCheckerPage() {
  useDocumentTitle('Symptom checker');
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [flags, setFlags] = useState([]);
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [duration, setDuration] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const loadCatalog = () => {
    setCatalogError(null);
    symptomService.catalog().then(setCatalog).catch(setCatalogError);
  };
  useEffect(loadCatalog, []);

  const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!selected.length && !flags.length && !description.trim()) {
      setFormError('Select at least one symptom or describe how you feel.');
      return;
    }
    setSubmitting(true);
    try {
      const data = await symptomService.check({
        symptoms: selected,
        redFlags: flags,
        description: description.trim(),
        ageGroup: ageGroup || undefined,
        duration: duration || undefined,
      });
      setResult(data);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelected([]);
    setFlags([]);
    setDescription('');
    setAgeGroup('');
    setDuration('');
    setResult(null);
  };

  const urgency = result ? URGENCY[result.urgency] || URGENCY.information : null;
  const suggested = result ? CATEGORY_META[result.suggestedFacilityType] : null;

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Symptom checker</h1>
        <p className="mt-2 text-slate-600">General health information to help you decide on next steps.</p>
      </div>

      <Alert tone="warning" className="mt-6" title="This is not a diagnosis">
        This tool offers general, educational information only. It cannot tell you what condition you have and does not
        recommend medicines or treatments. Always consult a qualified healthcare professional. If you think you may be having
        a medical emergency, call{' '}
        <a href="tel:112" className="font-semibold underline">
          112
        </a>{' '}
        now.
      </Alert>

      {catalog && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Bot className="h-3.5 w-3.5" aria-hidden="true" />
          {catalog.aiEnabled
            ? 'AI-assisted information is enabled on this server. Emergency warnings always use fixed safety rules.'
            : 'Mode: basic rule-based guidance. No AI model is connected — answers come from a fixed list of common symptoms.'}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <Card className="p-5 sm:p-6">
          {!catalog && !catalogError && (
            <div className="space-y-3" role="status" aria-label="Loading symptom list">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {catalogError && (
            <Alert tone="error" action={<Button size="sm" variant="outline" icon={RefreshCw} onClick={loadCatalog}>Try again</Button>}>
              {catalogError.message}
            </Alert>
          )}
          {catalog && (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <fieldset className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-red-900">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Is any of this happening?
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {catalog.redFlags.map((f) => (
                    <CheckboxPill key={f.id} danger label={f.label} checked={flags.includes(f.id)} onChange={() => toggle(flags, setFlags, f.id)} />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">Select your symptoms</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {catalog.symptoms.map((s) => (
                    <CheckboxPill key={s.id} label={s.label} checked={selected.includes(s.id)} onChange={() => toggle(selected, setSelected, s.id)} />
                  ))}
                </div>
              </fieldset>

              <Textarea
                label="Describe how you feel (optional)"
                hint="Please don't include your name, phone number or other personal details. Max 1000 characters."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="e.g. Headache and mild fever since yesterday evening"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Who is this for?" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  <option value="infant">Infant (under 2 years)</option>
                  <option value="child">Child</option>
                  <option value="adult">Adult</option>
                  <option value="older_adult">Older adult (65+)</option>
                  <option value="pregnant">Pregnant person</option>
                </Select>
                <Select label="How long?" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="">Not sure</option>
                  <option value="under_day">Less than a day</option>
                  <option value="1_3_days">1–3 days</option>
                  <option value="3_7_days">3–7 days</option>
                  <option value="over_week">More than a week</option>
                </Select>
              </div>

              {formError && <Alert tone="error">{formError}</Alert>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary" icon={ClipboardList} loading={submitting}>
                  Get guidance
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Clear
                </Button>
              </div>
            </form>
          )}
        </Card>

        <div ref={resultRef} tabIndex={-1} className="space-y-4 focus:outline-none" aria-live="polite">
          {!result && (
            <Card className="p-6 text-sm text-slate-600">
              <h2 className="font-semibold text-slate-900">Your guidance will appear here</h2>
              <p className="mt-2 leading-relaxed">
                You'll see general information about the symptoms you choose, warning signs that mean you should get help, and a
                shortcut to find suitable care nearby.
              </p>
            </Card>
          )}

          {result && (
            <>
              <div className={cn('flex items-start gap-3 rounded-2xl border p-5', urgency.tone)}>
                <urgency.icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-semibold">{urgency.label}</h2>
                  <p className="mt-1 text-xs opacity-80">{result.modeLabel}</p>
                </div>
              </div>

              {result.emergencyMessage && (
                <Alert tone="error" title="Get emergency help" role="alert">
                  <p>{result.emergencyMessage}</p>
                  <ul className="mt-2 list-inside list-disc">
                    {result.emergencyFlags.map((f) => (
                      <li key={f.id}>{f.label}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button href="tel:112" variant="emergency" size="sm" icon={Phone}>
                      Call 112
                    </Button>
                    <Button href="tel:102" variant="emergency" size="sm" icon={Phone}>
                      Call 102
                    </Button>
                    <Button to="/hospitals?type=hospital&radius=10000" size="sm" variant="outline">
                      Nearest hospitals
                    </Button>
                  </div>
                </Alert>
              )}
              {result.mentalHealthMessage && (
                <Alert tone="info" title="Support is available">
                  {result.mentalHealthMessage}{' '}
                  <a href="tel:14416" className="font-semibold underline">
                    Call 14416
                  </a>
                </Alert>
              )}
              {result.aiError && <Alert tone="warning">{result.aiError}</Alert>}

              {result.ai && (
                <Card className="space-y-3 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <Bot className="h-4 w-4 text-brand-600" aria-hidden="true" /> AI-generated general information
                  </h3>
                  {result.ai.summary && <p className="text-sm leading-relaxed text-slate-700">{result.ai.summary}</p>}
                  {[
                    ['Commonly associated with', result.ai.possibleCauses],
                    ['General self-care (non-medication)', result.ai.generalCare],
                    ['See a doctor if', result.ai.seeDoctorIf],
                  ].map(
                    ([title, items]) =>
                      items?.length > 0 && (
                        <div key={title}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
                            {items.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      ),
                  )}
                  <p className="text-xs text-slate-500">AI output can be wrong. It is not medical advice.</p>
                </Card>
              )}

              {result.matchedSymptoms.map((s) => (
                <Card key={s.id} className="p-5">
                  <h3 className="font-semibold text-slate-900">{s.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{s.info}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">See a doctor if</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
                    {s.seeDoctorIf.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </Card>
              ))}

              {result.notes.length > 0 && (
                <Alert tone="info">
                  <ul className="space-y-1">
                    {result.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {suggested && (
                <Button
                  to={`/hospitals?type=${result.suggestedFacilityType}&radius=10000`}
                  variant="primary"
                  icon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  Find {suggested.plural.toLowerCase()} near you
                </Button>
              )}

              <p className="rounded-lg bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">{result.disclaimer}</p>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
