'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, accentForIndex } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import { deleteTeamAction, saveTeamAction } from '@/server/actions/teams';
import type { GroupDto, TeamDto } from '@/lib/types';

function CrestPicker({
  value,
  onChange,
}: {
  value: { crestUrl: string | null; crestPublicId: string | null };
  onChange: (next: { crestUrl: string | null; crestPublicId: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useCloudinaryUpload('escudos');

  return (
    <div>
      <Label>Escudo (opcional)</Label>
      <div className="flex items-center gap-3">
        <TeamCrest
          team={{
            id: '',
            name: '',
            shortName: '?',
            crestUrl: value.crestUrl,
          }}
          size="lg"
        />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;

              const [asset] = await upload([file]);
              if (asset) {
                onChange({ crestUrl: asset.url, crestPublicId: asset.publicId });
              }
            }}
          />

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Enviando…' : 'Escolher imagem'}
          </Button>

          {value.crestUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange({ crestUrl: null, crestPublicId: null })}
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-sm text-accent">{error}</p>}
    </div>
  );
}

export function TeamsManager({
  teams,
  groups,
}: {
  teams: TeamDto[];
  groups: GroupDto[];
}) {
  const [editing, setEditing] = useState<TeamDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [crest, setCrest] = useState<{
    crestUrl: string | null;
    crestPublicId: string | null;
  }>({ crestUrl: null, crestPublicId: null });

  const save = useAction(saveTeamAction);
  const remove = useAction(deleteTeamAction);

  const open = creating || editing !== null;

  function startCreate() {
    setCrest({ crestUrl: null, crestPublicId: null });
    setCreating(true);
  }

  function startEdit(team: TeamDto) {
    setCrest({ crestUrl: team.crestUrl, crestPublicId: team.crestPublicId });
    setEditing(team);
  }

  function close() {
    setCreating(false);
    setEditing(null);
    save.reset();
  }

  function handleSubmit(formData: FormData) {
    save.run(
      {
        id: editing?.id,
        name: formData.get('name'),
        shortName: formData.get('shortName'),
        groupId: formData.get('groupId'),
        crestUrl: crest.crestUrl,
        crestPublicId: crest.crestPublicId,
      },
      close,
    );
  }

  const groupName = (id: string | null) =>
    groups.find((group) => group.id === id)?.name ?? 'Sem grupo';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Times</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} time(s) inscritos.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <ActionError message={remove.error} />

      {groups.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          Crie os grupos primeiro para conseguir alocar os times.
        </p>
      )}

      {teams.length === 0 ? (
        <EmptyState
          title="Nenhum time"
          description="Cadastre os times que vão disputar o campeonato."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {teams.map((team, index) => (
            <li key={team.id}>
              <Card accent={accentForIndex(index)} className="flex items-center gap-3 p-3">
                <TeamCrest
                  team={team}
                  size="md"
                  accent={index % 2 === 0 ? 'green' : 'orange'}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase leading-tight">
                    {team.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {team.shortName} · {groupName(team.groupId)}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(team)}
                  aria-label={`Editar ${team.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.pending}
                  onClick={() => {
                    if (confirm(`Excluir ${team.name}?`)) {
                      remove.run({ id: team.id });
                    }
                  }}
                  aria-label={`Excluir ${team.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={close} title={editing ? 'Editar time' : 'Novo time'}>
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label="Nome do time"
            placeholder="Feras do Bairro"
            defaultValue={editing?.name ?? ''}
            required
            error={save.fieldErrors.name}
          />

          <Input
            id="shortName"
            name="shortName"
            label="Sigla"
            placeholder="FER"
            maxLength={5}
            defaultValue={editing?.shortName ?? ''}
            required
            error={save.fieldErrors.shortName}
            className="uppercase"
          />

          <Select
            id="groupId"
            name="groupId"
            label="Grupo"
            defaultValue={editing?.groupId ?? ''}
            error={save.fieldErrors.groupId}
          >
            <option value="">Sem grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>

          <CrestPicker value={crest} onChange={setCrest} />

          <ActionError message={save.error} />

          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={save.pending}>
              {save.pending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
