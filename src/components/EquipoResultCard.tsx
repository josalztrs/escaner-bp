import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonListHeader,
  IonRow,
} from '@ionic/react';
import {
  banOutline,
  warningOutline,
  closeCircleOutline,
  personOutline,
  cubeOutline,
} from 'ionicons/icons';
import type { EquipoResponse } from '../services/Escaner';

/* ── Interfaces ── */

interface EquipoResultCardProps {
  /** El resultado completo devuelto por la API (puede contener `error` y `message`). */
  resultado: EquipoResponse;
  /** Serial number escaneado. */
  serialNumber: string;
  /** Callback para limpiar / descartar el resultado. */
  onClear: () => void;
}

/* ── Helpers ── */

/**
 * Resuelve el objeto plano del equipo sin importar si la API lo devuelve
 * como objeto directo, array, o envuelto en `data`, `equipo`, etc.
 */
const resolveFlat = (raw: EquipoResponse): Record<string, unknown> => {
  let obj: unknown = raw;

  // Unwrap array
  if (Array.isArray(obj)) obj = obj[0] ?? {};

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    for (const wk of ['data', 'equipo', 'result', 'record', 'item']) {
      const inner = record[wk];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        return inner as Record<string, unknown>;
      }
      if (Array.isArray(inner) && inner.length > 0) {
        return (inner[0] ?? {}) as Record<string, unknown>;
      }
    }
    return record;
  }
  return {};
};

const field = (data: Record<string, unknown>, key: string): string => {
  const val = data[key];
  return val == null || val === '' ? '—' : String(val);
};

/* ── Component ── */

const EquipoResultCard: React.FC<EquipoResultCardProps> = ({
  resultado,
  serialNumber,
  onClear,
}) => {
  const flat = resolveFlat(resultado);
  const isError = flat['error'] === true || flat['error'] === 'true';
  const message = String(flat['message'] ?? flat['msg'] ?? '').toLowerCase();

  /* ─── Caso 1: Bien no registrado ─── */
  if (isError && message.includes('no está registrado')) {
    return (
      <IonCard className="glass-card ion-margin-top" style={{ borderLeft: '6px solid var(--ion-color-danger)' }}>
        <IonCardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IonIcon icon={banOutline} color="danger" style={{ fontSize: '2.5rem' }} />
            <div>
              <IonCardTitle>Bien No Encontrado</IonCardTitle>
              <IonCardSubtitle className="ion-text-capitalize">
                S/N: {serialNumber}
              </IonCardSubtitle>
            </div>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <p style={{ fontSize: '1rem', color: 'var(--ion-color-step-600)' }}>
            {String(flat['message'] ?? flat['msg'] ?? 'El serial escaneado no está registrado en el sistema.')}
          </p>
          <IonButton
            fill="clear"
            expand="block"
            color="danger"
            className="ion-margin-top"
            onClick={onClear}
          >
            <IonIcon icon={closeCircleOutline} slot="start" />
            Limpiar resultado
          </IonButton>
        </IonCardContent>
      </IonCard>
    );
  }

  /* ─── Caso 2: Sin asignación ─── */
  if (isError && message.includes('sin asignación')) {
    return (
      <IonCard className="glass-card ion-margin-top" style={{ borderLeft: '6px solid var(--ion-color-warning)' }}>
        <IonCardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IonIcon icon={warningOutline} color="warning" style={{ fontSize: '2.5rem' }} />
            <div>
              <IonCardTitle>Pendiente de Asignación</IonCardTitle>
              <IonCardSubtitle className="ion-text-capitalize">
                S/N: {serialNumber}
              </IonCardSubtitle>
            </div>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <p style={{ fontSize: '1rem', color: 'var(--ion-color-step-600)' }}>
            {String(flat['message'] ?? flat['msg'] ?? 'Este bien no tiene un responsable asignado actualmente.')}
          </p>
          <IonButton
            fill="clear"
            expand="block"
            color="warning"
            className="ion-margin-top"
            onClick={onClear}
          >
            <IonIcon icon={closeCircleOutline} slot="start" />
            Limpiar resultado
          </IonButton>
        </IonCardContent>
      </IonCard>
    );
  }

  /* ─── Caso 3: Éxito – datos del equipo ─── */
  const estado = field(flat, 'ESTADO');

  return (
    <IonCard className="glass-card ion-margin-top">
      <IonCardHeader>
        <div className="result-header">
          <div>
            <IonCardSubtitle>Resultado del escaneo</IonCardSubtitle>
            <IonCardTitle color="primary" style={{ fontWeight: 800 }}>S/N: {serialNumber}</IonCardTitle>
          </div>
          {estado !== '—' && (
            <IonBadge color="success" className="status-badge">
              {estado}
            </IonBadge>
          )}
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* ── Sección: Responsable ── */}
        <IonListHeader style={{ paddingInline: 0, minHeight: 'auto', marginBottom: 4 }}>
          <IonLabel>
            <IonIcon icon={personOutline} slot="start" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            <strong>Información del Responsable</strong>
          </IonLabel>
        </IonListHeader>
        <IonGrid style={{ padding: 0 }}>
          <IonRow>
            <IonCol size="12">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap ion-text-capitalize">
                  <p>Nombre</p>
                  <h3>{field(flat, 'TRAB_NOM')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap ion-text-capitalize">
                  <p>Departamento</p>
                  <h3>{field(flat, 'DEPTO')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap ion-text-capitalize">
                  <p>Cargo</p>
                  <h3>{field(flat, 'TRAB_CARGO')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* ── Sección: Activo ── */}
        <IonListHeader style={{ paddingInline: 0, minHeight: 'auto', marginTop: 12, marginBottom: 4 }}>
          <IonLabel>
            <IonIcon icon={cubeOutline} slot="start" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            <strong>Información del Activo</strong>
          </IonLabel>
        </IonListHeader>
        <IonGrid style={{ padding: 0 }}>
          <IonRow>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap">
                  <p>Categoría</p>
                  <h3>{field(flat, 'CATEG_BIEN')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap">
                  <p>Marca</p>
                  <h3>{field(flat, 'MARCA')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap">
                  <p>Modelo</p>
                  <h3>{field(flat, 'MODELO')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
            <IonCol size="6">
              <IonItem lines="inset">
                <IonLabel className="ion-text-wrap">
                  <p>Serial</p>
                  <h3>{field(flat, 'SERIAL')}</h3>
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* ── Botón limpiar ── */}
        <IonButton
          fill="clear"
          expand="block"
          className="ion-margin-top"
          onClick={onClear}
          color="medium"
        >
          <IonIcon icon={closeCircleOutline} slot="start" />
          Descartar vista
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default EquipoResultCard;
