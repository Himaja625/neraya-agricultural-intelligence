import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getFields, createField, deleteField } from '@/lib/db';
import type { Field } from '@/types';
import { GROWTH_STAGES } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  Sprout, Plus, MapPin, Calendar, Trash2, ArrowRight, FlaskConical,
} from '@/components/ui/Icons';

interface FieldsPageProps {
  onOpenField: (fieldId: string) => void;
}

export default function Fields({ onOpenField }: FieldsPageProps) {
  const { profile } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [locationText, setLocationText] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getFields(profile.user_id).then(f => {
      setFields(f);
      setLoading(false);
    });
  }, [profile]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !name.trim()) return;
    setCreating(true);
    const field = await createField(profile.user_id, {
      name: name.trim(),
      crop_type: cropType || null,
      crop_variety: cropVariety || null,
      location_text: locationText || null,
      area_size: areaSize || null,
      planting_date: plantingDate || null,
      growth_stage: growthStage || null,
      notes: notes || null,
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
    if (field) {
      setFields([field, ...fields]);
      setShowCreate(false);
      setName(''); setCropType(''); setCropVariety(''); setLocationText('');
      setAreaSize(''); setPlantingDate(''); setGrowthStage(''); setNotes('');
    }
    setCreating(false);
  }

  async function handleDelete(fieldId: string) {
    await deleteField(fieldId);
    setFields(fields.filter(f => f.id !== fieldId));
  }

  if (loading) return <LoadingState label="Loading your fields..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-medium text-forest-950">My Fields</h1>
          <p className="text-sm text-forest-500 mt-1">Manage and monitor your farm fields.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> Add field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon={<Sprout size={32} />}
            title="Your fields will appear here once you add one."
            description="Tell Neraya about a field you'd like to monitor. Add the crop, location, and planting details so Neraya can give you relevant guidance."
            action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={18} /> Add your first field</button>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <div key={field.id} className="card p-5 group hover:shadow-soft-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <button onClick={() => onOpenField(field.id)} className="text-left flex-1">
                  <h3 className="font-serif text-lg font-medium text-forest-900 group-hover:text-forest-700">{field.name}</h3>
                  {field.crop_type && (
                    <p className="text-sm text-forest-500 mt-0.5 flex items-center gap-1.5">
                      <Sprout size={14} /> {field.crop_type}{field.crop_variety ? ` (${field.crop_variety})` : ''}
                    </p>
                  )}
                </button>
                <button onClick={() => handleDelete(field.id)} className="p-1.5 rounded-lg text-forest-300 hover:text-error-500 hover:bg-error-50 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs text-forest-500 mb-4">
                {field.location_text && <p className="flex items-center gap-1.5"><MapPin size={12} /> {field.location_text}</p>}
                {field.planting_date && <p className="flex items-center gap-1.5"><Calendar size={12} /> Planted {new Date(field.planting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                {field.area_size && <p className="flex items-center gap-1.5"><Sprout size={12} /> {field.area_size}</p>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-forest-100">
                {field.growth_stage ? <Badge variant="success">{field.growth_stage}</Badge> : <span className="text-xs text-forest-400">No growth stage set</span>}
                <button onClick={() => onOpenField(field.id)} className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1">
                  View <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add a new field" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Field name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Tomato Field A" className="input-field" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Crop type</label>
              <input type="text" value={cropType} onChange={e => setCropType(e.target.value)} placeholder="e.g. Tomato" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Variety (optional)</label>
              <input type="text" value={cropVariety} onChange={e => setCropVariety(e.target.value)} placeholder="e.g. Roma" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Location</label>
            <input type="text" value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="e.g. North plot, near the river" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Area size</label>
              <input type="text" value={areaSize} onChange={e => setAreaSize(e.target.value)} placeholder="e.g. 2 acres" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Planting date</label>
              <input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Growth stage</label>
            <select value={growthStage} onChange={e => setGrowthStage(e.target.value)} className="input-field">
              <option value="">Select stage</option>
              {GROWTH_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything worth remembering about this field..." className="input-field min-h-[80px] resize-y" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Adding...' : 'Add field'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
