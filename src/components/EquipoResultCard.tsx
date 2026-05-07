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
      <IonCard color="danger" className="ion-margin-top" style={{ marginInline: 0 }}>
        <IonCardHeader>
          <IonIcon icon={banOutline} slot="start" style={{ fontSize: '2rem', marginBottom: 8 }} />
          <IonCardTitle>Bien No Encontrado</IonCardTitle>
          <IonCardSubtitle className="ion-text-capitalize">
            S/N: {serialNumber}
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <p>{String(flat['message'] ?? flat['msg'] ?? 'El serial escaneado no está registrado en el sistema.')}</p>
          <IonButton
            fill="outline"
            expand="block"
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
      <IonCard color="warning" className="ion-margin-top" style={{ marginInline: 0 }}>
        <IonCardHeader>
          <IonIcon icon={warningOutline} slot="start" style={{ fontSize: '2rem', marginBottom: 8 }} />
          <IonCardTitle>Pendiente de Asignación</IonCardTitle>
          <IonCardSubtitle className="ion-text-capitalize">
            S/N: {serialNumber}
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <p>{String(flat['message'] ?? flat['msg'] ?? 'Este bien no tiene un responsable asignado actualmente.')}</p>
          <IonButton
            fill="outline"
            expand="block"
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
    <IonCard className="ion-margin-top" style={{ marginInline: 0 }}>
      <IonCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <div>
            <IonCardSubtitle>Resultado del escaneo</IonCardSubtitle>
            <IonCardTitle style={{ fontSize: '1.1rem' }}>S/N: {serialNumber}</IonCardTitle>
          </div>
          {estado !== '—' && (
            <IonBadge color="success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
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
          fill="outline"
          expand="block"
          className="ion-margin-top"
          onClick={onClear}
        >
          <IonIcon icon={closeCircleOutline} slot="start" />
          Limpiar resultado
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default EquipoResultCard;
