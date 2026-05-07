import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { clearRecords, listRecords, ScanRecord } from '../services/scanHistoryStore';

const HistoryTab: React.FC = () => {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await listRecords();
    setRecords(data);
  }, []);

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
          fill="outline"
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
            {records.map((r) => (
              <IonItem key={r.id}>
                <IonLabel className="ion-text-wrap">
                  <h2>{r.value}</h2>
                  <p>
                    <strong>Ubicación:</strong> {r.location}
                  </p>
                  <p>
                    <strong>Fecha:</strong> {new Date(r.createdAt).toLocaleString()}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default HistoryTab;

