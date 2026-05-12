import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  banOutline,
  warningOutline,
  helpCircleOutline,
  shareOutline,
  filterOutline,
} from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { clearRecords, listRecords, ScanRecord, ScanStatus } from '../services/scanHistoryStore';

/* ── Status helpers ── */

const statusConfig: Record<
  ScanStatus,
  { label: string; color: string; icon: string }
> = {
  found: { label: 'Encontrado', color: 'success', icon: checkmarkCircleOutline },
  'not-found': { label: 'No registrado', color: 'danger', icon: banOutline },
  'no-assignment': { label: 'Sin asignación', color: 'warning', icon: warningOutline },
};

const getStatusInfo = (status?: ScanStatus) => {
  if (!status) return { label: 'Desconocido', color: 'medium', icon: helpCircleOutline };
  return statusConfig[status] ?? { label: status, color: 'medium', icon: helpCircleOutline };
};

const DetailLine = ({ label, value }: { label: string; value?: string }) => {
  if (!value || value.trim() === '') return null;
  return (
    <p style={{ margin: '2px 0' }}>
      <strong>{label}:</strong> {value}
    </p>
  );
};

/* ── Component ── */

const HistoryTab: React.FC = () => {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const refresh = useCallback(async () => {
    const data = await listRecords();
    setRecords(data);
  }, []);

  const handleShare = async (record: ScanRecord) => {
    const info = getStatusInfo(record.status);
    let text = `Reporte de Bien - SN: ${record.value}\n`;
    text += `Estado: ${info.label}\n`;
    text += `Dpto. Escaneo: ${record.location}\n`;
    if (record.depto) text += `Dpto. Asignación: ${record.depto}\n`;
    if (record.equipoName) text += `Responsable: ${record.equipoName}\n`;
    if (record.marca) text += `Marca: ${record.marca}\n`;
    if (record.modelo) text += `Modelo: ${record.modelo}\n`;
    if (record.createdAt) text += `Fecha: ${new Date(record.createdAt).toLocaleString()}\n`;

    await Share.share({
      title: 'Compartir Registro de Escaneo',
      text: text,
      dialogTitle: 'Enviar reporte',
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const q = searchText.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesQuery =
        r.value.toLowerCase().includes(q) ||
        (r.equipoName?.toLowerCase().includes(q) ?? false) ||
        (r.location.toLowerCase().includes(q) ?? false) ||
        (r.marca?.toLowerCase().includes(q) ?? false) ||
        (r.modelo?.toLowerCase().includes(q) ?? false);

      return matchesStatus && matchesQuery;
    });
  }, [records, searchText, statusFilter]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listRecords();
        if (mounted) setRecords(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Historial</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value ?? '')}
            placeholder="Buscar por S/N, responsable..."
            debounce={300}
            className="ion-no-padding ion-padding-horizontal"
            style={{ '--box-shadow': 'none' }}
          />
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="glass-card" style={{ padding: '4px 8px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon icon={filterOutline} color="medium" style={{ marginLeft: 8 }} />
          <IonSelect
            value={statusFilter}
            onIonChange={(e) => setStatusFilter(e.detail.value)}
            interface="popover"
            className="ion-no-padding"
            style={{ width: '100%' }}
          >
            <IonSelectOption value="all">Todos los estados</IonSelectOption>
            <IonSelectOption value="found">Encontrados</IonSelectOption>
            <IonSelectOption value="not-found">No registrados</IonSelectOption>
            <IonSelectOption value="no-assignment">Sin asignación</IonSelectOption>
          </IonSelect>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <IonButton
            expand="block"
            className="premium-button"
            style={{ flex: 1, margin: 0 }}
            onClick={() => {
              void refresh();
            }}
          >
            Actualizar
          </IonButton>

          <IonButton
            expand="block"
            color="danger"
            fill="clear"
            style={{ margin: 0 }}
            onClick={() => {
              void (async () => {
                await clearRecords();
                await refresh();
              })();
            }}
          >
            Limpiar
          </IonButton>
        </div>

        {loading ? (
          <IonNote color="medium">Cargando...</IonNote>
        ) : filteredRecords.length === 0 ? (
          <IonNote color="medium">
            {records.length === 0 
              ? 'Aún no hay registros. Vuelve al tab de Escaneo para crear uno.' 
              : 'No se encontraron registros que coincidan con los filtros.'}
          </IonNote>
        ) : (
          <IonList inset style={{ background: 'transparent', margin: 0, padding: 0 }}>
            {filteredRecords.map((r) => {
              const info = getStatusInfo(r.status);

              return (
                <IonItem
                  key={r.id}
                  className="history-item glass-card"
                  lines="none"
                >
                  <IonIcon
                    icon={info.icon}
                    color={info.color}
                    slot="start"
                    style={{ fontSize: '1.5rem' }}
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    color="primary"
                    size="large"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleShare(r);
                    }}
                  >
                    <IonIcon icon={shareOutline} slot="icon-only" style={{ fontSize: '1.8rem' }} />
                  </IonButton>
                  <IonLabel className="ion-text-wrap">
                    {/* Serial + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: 'var(--ion-text-color)' }}>{r.value}</h2>
                      <IonBadge
                        color={info.color}
                        className="status-badge"
                      >
                        {info.label}
                      </IonBadge>
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <DetailLine label="Dpto. escaneo" value={r.location} />
                      <DetailLine label="Dpto. asignación" value={r.depto} />
                    </div>

                    {r.equipoName && (
                      <p style={{ marginTop: 6 }}>
                        <strong>Responsable:</strong>{' '}
                        <span style={{ textTransform: 'capitalize' }}>{r.equipoName.toLowerCase()}</span>
                      </p>
                    )}
                    <DetailLine label="Cargo" value={r.cargo} />
                    <DetailLine label="División" value={r.division} />

                    {(r.categoria || r.marca || r.modelo || r.descripcion || r.claseBien || r.propietario) && (
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--ion-color-step-150, rgba(0,0,0,0.08))' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>
                          Activo
                        </p>
                        <DetailLine label="Categoría" value={r.categoria} />
                        <DetailLine label="Clase" value={r.claseBien} />
                        <DetailLine label="Marca" value={r.marca} />
                        <DetailLine label="Modelo" value={r.modelo} />
                      </div>
                    )}

                    {r.estado && r.status === 'found' && (
                      <p style={{ marginTop: 6 }}>
                        <strong>Estado del bien:</strong> {r.estado}
                      </p>
                    )}

                    {r.raw && (
                      <p style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>
                        <strong>Código leído:</strong> <span style={{ wordBreak: 'break-all' }}>{r.raw}</span>
                      </p>
                    )}

                    {r.httpStatus != null && (
                      <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                        <strong>HTTP:</strong> {r.httpStatus}
                      </p>
                    )}

                    {r.message && (
                      <p
                        style={{
                          marginTop: 8,
                          color: `var(--ion-color-${info.color}-shade, var(--ion-color-${info.color}))`,
                          fontStyle: 'italic',
                        }}
                      >
                        {r.message}
                      </p>
                    )}

                    <p style={{ marginTop: 8, color: 'var(--ion-color-medium)', fontSize: '0.85rem' }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default HistoryTab;
