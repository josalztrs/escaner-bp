import { useCallback, useEffect, useState } from 'react';
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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  banOutline,
  warningOutline,
  helpCircleOutline,
  shareOutline,
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
      </IonHeader>

      <IonContent className="ion-padding">
        <IonButton
          expand="block"
          className="premium-button"
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
          className="ion-margin-bottom"
          onClick={() => {
            void (async () => {
              await clearRecords();
              await refresh();
            })();
          }}
        >
          Limpiar historial
        </IonButton>

        {loading ? (
          <IonNote color="medium">Cargando...</IonNote>
        ) : records.length === 0 ? (
          <IonNote color="medium">Aún no hay registros. Vuelve al tab de Escaneo para crear uno.</IonNote>
        ) : (
          <IonList inset>
            {records.map((r) => {
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
