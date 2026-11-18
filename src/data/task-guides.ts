import type { Actor, NavigationId } from "../types/navigation"
import type { ScreenId } from "./help-context"

export type GuideStep = { title: string; instruction: string; result: string; screen: ScreenId; alternative?: string }
export type Guide = {
  id: string; title: string; description: string; roles: Actor[]; destination: NavigationId
  caution: string; entry: string; result: string; recovery: string; steps: GuideStep[]
}

export const guides: Guide[] = [
  {
    id: "expediente", title: "Abrir un expediente y elegir cómo continuar", description: "De Ver expediente a documentos, seguimiento y retorno al listado.",
    roles: ["analyst", "supervisor", "reviewer", "exchange", "auditor"], destination: "locate",
    entry: "Analista, Supervisor y Revisor pueden partir de pendientes o localización. Personal documentario accede desde localización o un intercambio. Auditor entra desde una actuación de trazabilidad.",
    caution: "Ver expediente es una consulta. No atiende el pendiente, no cambia al responsable ni concede nuevas atribuciones.",
    result: "Has identificado el expediente y la vía adecuada para continuar, sin modificar sus datos por consultarlo.",
    recovery: "Si no encuentras el expediente, revisa identificador y filtros. Si una sección está restringida, conserva ese límite: una guía no habilita permisos.",
    steps: [
      { title: "Abre la fila correcta", screen: "pending", instruction: "Comprueba la referencia y pulsa Ver expediente. Desde un intercambio usa Ver expediente relacionado; desde trazabilidad, Ver expediente compartido.", result: "Se abre el detalle con su referencia y la procedencia del acceso." },
      { title: "Comprueba el contexto", screen: "detail", instruction: "Lee responsable vigente, situación operacional, última actuación y contexto institucional. Comprueba si existe una solicitud pendiente.", result: "Puedes distinguir responsabilidad vigente de una solicitud todavía no resuelta.", alternative: "Por asignar significa ausencia de responsable; solo Supervisor puede preparar la asignación inicial." },
      { title: "Elige una vía, no todas", screen: "detail", instruction: "Para consultar archivos usa Abrir documentos y versiones. Para antecedentes, revisa Seguimiento y situación temporal. Para actuar sobre responsabilidad o intercambios utiliza únicamente los controles habilitados.", result: "Abrir documentos lleva al inspector; seleccionar un evento de seguimiento abre su detalle. Ninguna consulta confirma una operación.", alternative: "Auditor y Personal documentario no tienen seguimiento CU-08 habilitado. No se muestran sus eventos ni fechas de seguimiento." },
      { title: "Regresa al origen", screen: "detail", instruction: "Desde documentos vuelve al detalle. Después usa Volver a pendientes, localización, intercambios o trazabilidad, según indique la pantalla.", result: "Regresas al listado de procedencia con sus filtros conservados. Los cambios que hayas confirmado siguen registrados durante esta sesión demo." },
    ],
  },
  {
    id: "localizar", title: "Localizar y consultar un expediente", description: "Buscar, recuperar una consulta vacía y abrir el contexto correcto.",
    roles: ["analyst", "supervisor", "reviewer", "exchange"], destination: "locate",
    entry: "Entra en Localizar expedientes desde la navegación de tu perfil.", caution: "La búsqueda solo consulta el conjunto de expedientes ficticios; no accede a servicios institucionales.",
    result: "Consulta abierta y retorno a los criterios de origen sin alterar el expediente.", recovery: "Limpiar criterios restablece la consulta inicial, no elimina expedientes. Restaurar acceso de demostración solo revierte la prueba de restricción, no habilita permisos reales.",
    steps: [
      { title: "Define el criterio", screen: "locate", instruction: "Escribe parte o toda la referencia, por ejemplo DEMO-TRASU-003. Usa Responsable vigente y Situación operativa si necesitas reducir el conjunto.", result: "El criterio queda preparado. Los selectores también activan la consulta; el texto se consulta al pulsar Buscar." },
      { title: "Ejecuta y comprueba", screen: "locate", instruction: "Pulsa Buscar o Mostrar expedientes de ejemplo. Lee referencia, responsable y situación antes de abrir una fila.", result: "Ves el número de resultados o una explicación de por qué no se muestra ninguno.", alternative: "Sin resultados: revisa el identificador y usa Limpiar criterios. Acceso restringido: no se muestran datos; si activaste la simulación, puedes restaurar el acceso demo." },
      { title: "Abre el detalle", screen: "detail", instruction: "Pulsa Ver expediente y contrasta la referencia y procedencia con la fila elegida. Puedes abrir documentos y consultar las secciones autorizadas.", result: "El expediente se consulta sin cambiar responsable ni estado." },
      { title: "Retorna a la búsqueda", screen: "detail", instruction: "Pulsa Volver a localizar expedientes. Para empezar de nuevo utiliza Limpiar.", result: "Los criterios originales se mantienen al regresar del detalle; Limpiar los reinicia." },
    ],
  },
  {
    id: "seguimiento", title: "Consultar seguimiento y abrir un antecedente", description: "De un pendiente a su evento, documento relacionado y regreso.",
    roles: ["analyst", "supervisor", "reviewer"], destination: "pending",
    entry: "Parte de Pendientes y seguimiento y elige un expediente visible para tu perfil.", caution: "Fecha registrada no equivale a plazo computado. La situación jurídica no se determina en el prototipo.",
    result: "Has contrastado evento, fecha, actor y origen sin alterar el registro.", recovery: "Si activas Probar error, Reintentar recupera la consulta ficticia. Un dato no consignado debe conservarse como desconocido, no completarse por suposición.",
    steps: [
      { title: "Abre el seguimiento", screen: "pending", instruction: "Pulsa Ver seguimiento en la fila del expediente. También está disponible dentro de su detalle.", result: "Se destaca Seguimiento y situación temporal del mismo expediente, no se abre otro registro." },
      { title: "Interpreta el resumen", screen: "detail", instruction: "Contrasta situación, responsable y última actuación con los eventos. Las fechas registradas no calculan plazos.", result: "Distingues información registrada, plazo no disponible y situación jurídica no determinada." },
      { title: "Consulta el evento", screen: "detail", instruction: "Selecciona un evento de Línea temporal operacional. Comprueba referencia, fecha, actor y origen en el diálogo.", result: "Solo se abre información; Cerrar o Escape vuelve al evento.", alternative: "Si el evento vincula un documento aparece Ver registro documental. Si vincula una solicitud, solo Supervisor puede ir a Ver solicitudes; la bandeja no llega filtrada automáticamente." },
      { title: "Contrasta y vuelve", screen: "documents", instruction: "Si abriste Ver registro documental, verifica en el inspector la versión exacta del evento. Vuelve al detalle y después al listado de procedencia.", result: "Regresas sin sobrescribir versiones ni modificar el seguimiento." },
    ],
  },
  {
    id: "documentos", title: "Consultar documentos y comprender sus versiones", description: "Identidad exacta, estados, observaciones y acciones disponibles.",
    roles: ["analyst", "supervisor", "reviewer", "exchange", "auditor"], destination: "locate",
    entry: "Abre un expediente por un acceso permitido y pulsa Abrir documentos y versiones. Auditor parte de trazabilidad, no de localización.",
    caution: "El inspector muestra una vista simulada, no un PDF institucional. Cambiar de selección no cambia el estado documental.",
    result: "Has consultado la versión exacta y sabes si corresponde esperar revisión, subsanar o preparar un envío.", recovery: "Sin documentos no existe una acción de carga inicial en esta pantalla. Sin coincidencias usa Limpiar filtros. Ante el error simulado pulsa Reintentar; no se modifica información.",
    steps: [
      { title: "Entra al espacio documental", screen: "detail", instruction: "Pulsa Abrir documentos y versiones y comprueba la referencia del expediente en el encabezado.", result: "Aparecen el listado de versiones y un inspector, o un estado explícito sin documentos." },
      { title: "Selecciona y verifica", screen: "documents", instruction: "Busca documento o versión y filtra Situación interna. Selecciona una fila; comprueba Versión exacta, autor, archivo y estado en el inspector.", result: "El inspector cambia de versión. Un filtro puede ocultar la fila de la versión seleccionada sin cambiar la selección: comprueba siempre su identidad." },
      { title: "Interpreta las opciones", screen: "documents", instruction: "Analista: una versión apta o nueva sin tarea vinculada permite Someter esta versión a revisión; Observada permite Subsanar observaciones. Una tarea vinculada se muestra con su identificador.", result: "Una versión en revisión se espera; una conformidad es interna. Otros perfiles consultan sin enviar ni subsanar.", alternative: "Si falta un botón, revisa perfil, estado y revisión vinculada; no cambies de rol para eludir una restricción." },
      { title: "Vuelve al expediente", screen: "documents", instruction: "Pulsa Volver al detalle del expediente. Conserva la referencia de la versión que consultaste si necesitas contrastarla con seguimiento.", result: "Las versiones permanecen. Al reabrir este espacio se reinician sus filtros locales." },
    ],
  },
  {
    id: "revision", title: "Preparar una versión para revisión", description: "Expediente → versión exacta → comprobación → envío → resultado.",
    roles: ["analyst"], destination: "pending", entry: "Abre un expediente visible y entra en Documentos y versiones.",
    caution: "Solo una versión Apta para envío o Nueva versión · requiere revisión sin tarea vinculada admite el envío. No implica aprobación externa.",
    result: "Revisión creada para la versión exacta, estado En revisión interna e identificador REV-DEMO visible.", recovery: "Si no aparece el envío, verifica estado y tarea vinculada. Cancelar o Volver en la confirmación no crea una revisión. No vuelvas a enviar si ya existe una.",
    steps: [
      { title: "Elige la versión", screen: "documents", instruction: "Selecciona la fila y comprueba su identidad en el inspector. Pulsa Someter esta versión a revisión si está habilitado.", result: "Se abre la comprobación de la versión, todavía sin enviar." },
      { title: "Comprueba el destino", screen: "submitReview", instruction: "Lee documento, archivo, autor y situación. El destinatario demo es Revisor DEMO-003; no existe selector libre. Pulsa Revisar y confirmar envío.", result: "Se abre Confirmar envío a revisión con la versión exacta." },
      { title: "Confirma conscientemente", screen: "submitReview", instruction: "Si coincide, pulsa Confirmar envío de la versión indicada. Si no, Volver permite revisar o Cancelar devuelve a documentos sin enviar.", result: "Solo confirmar crea una tarea, actualiza esa versión y registra su traza; las anteriores no se sobrescriben." },
      { title: "Verifica y continúa", screen: "documents", instruction: "Comprueba el aviso, En revisión interna y la revisión vinculada. Vuelve al expediente o espera el resultado del Revisor en este prototipo.", result: "El envío no se repite. Si posteriormente queda Observada, continúa con la guía de subsanación." },
    ],
  },
  {
    id: "subsanacion", title: "Atender observaciones sin perder versiones", description: "De la versión observada a una nueva versión y su siguiente revisión.",
    roles: ["analyst"], destination: "pending", entry: "Dentro de documentos selecciona una versión Observada y lee todas sus observaciones.",
    caution: "Una nueva versión no obtiene conformidad automática. La atención parcial es registrable, pero no elimina el antecedente observado.",
    result: "Nueva versión enlazada con estado Nueva versión · requiere revisión; la observada sigue consultable.", recovery: "La validación exige archivo de ejemplo y tipo/nota por cada observación. Cancelar descarta la preparación, no la versión anterior.",
    steps: [
      { title: "Abre la atención", screen: "documents", instruction: "Selecciona la versión Observada y pulsa Subsanar observaciones. Comprueba la cadena entre versión anterior, atención y nueva versión.", result: "Se muestran los campos de cada observación sin modificar la versión original." },
      { title: "Documenta y prepara", screen: "subsanate", instruction: "En cada observación elige Atendida o Atención parcial y escribe su descripción. Pulsa Incorporar archivo demostrativo; no se realiza carga real.", result: "El archivo ficticio aparece seleccionado y todas las observaciones tienen su atención documentada." },
      { title: "Revisa y crea", screen: "subsanate", instruction: "Pulsa Revisar nueva versión. Si faltan datos, corrígelos. En Confirmar nueva versión comprueba el enlace y pulsa Crear la versión indicada.", result: "Se añade una versión nueva y se vuelve al espacio documental con el aviso; no se borra la observada." },
      { title: "Continúa con otra revisión", screen: "documents", instruction: "Comprueba el enlace a la anterior, atención y estado Requiere revisión. Si procede, usa Someter esta versión a revisión y sigue su comprobación y confirmación.", result: "La nueva revisión, cuando la confirmes, quedará asociada a esta versión y no a la observada." },
    ],
  },
  {
    id: "asignacion", title: "Asignar la responsabilidad inicial", description: "Expediente sin responsable → selección → confirmación → historial.",
    roles: ["supervisor"], destination: "locate", entry: "Localiza un expediente Por asignar, por ejemplo DEMO-TRASU-006, y abre su detalle.",
    caution: "Primera asignación y reasignación son circuitos distintos. Asignar no incorpora el expediente al circuito ni cambia su situación operacional.",
    result: "Responsable vigente e historial actualizados, con traza local de asignación.", recovery: "Si ya hay responsable, la asignación inicial no corresponde. Evalúa el circuito de solicitudes; no sobrescribas la responsabilidad con otra asignación inicial.",
    steps: [
      { title: "Verifica la condición", screen: "detail", instruction: "Comprueba Por asignar en Responsable vigente. Pulsa Asignar responsable inicial.", result: "Se abre el formulario exclusivo de Supervisor." },
      { title: "Prepara la asignación", screen: "assign", instruction: "Elige un Responsable habilitado del conjunto ficticio y pulsa Revisar asignación. Sin selección se indica el dato faltante.", result: "Aparece el diálogo con expediente y responsable propuesto. La demostración no calcula capacidad ni carga." },
      { title: "Confirma o corrige", screen: "assign", instruction: "Confirma asignación únicamente si coincide. Volver permite cambiar la selección; Cancelar en el formulario vuelve sin registrar.", result: "La confirmación aplica el nuevo responsable y vuelve al detalle." },
      { title: "Verifica el antecedente", screen: "detail", instruction: "Lee el aviso, Responsable vigente y Responsabilidad y antecedentes de asignación. Regresa después al listado de origen.", result: "La primera responsabilidad aparece en el historial y no se ofrece otra asignación inicial." },
    ],
  },
  {
    id: "solicitar", title: "Solicitar una reasignación y comprobar su estado", description: "Motivar una petición sin confundirla con el cambio de responsable.",
    roles: ["analyst"], destination: "pending", entry: "Abre un expediente cuya responsabilidad sea Usuario DEMO-014 y que no tenga solicitud pendiente.",
    caution: "Enviar solicitud registra directamente la petición; no tiene confirmación adicional y no cambia al responsable vigente.",
    result: "Solicitud SOL-DEMO pendiente de evaluación, con responsabilidad anterior conservada.", recovery: "Si ya hay una pendiente, espera su evaluación. Si no eres el responsable no se habilita esta acción. Cancelar descarta el motivo sin registrar.",
    steps: [
      { title: "Comprueba responsable y antecedentes", screen: "detail", instruction: "En Gestión de responsabilidad verifica que no exista una solicitud pendiente. Pulsa Solicitar reasignación si está habilitado.", result: "Se abre el motivo, junto al expediente y al responsable actual." },
      { title: "Escribe el sustento", screen: "request", instruction: "Completa Motivo obligatorio con una explicación operativa. No se pide un nuevo responsable; lo define Supervisor al aprobar.", result: "El motivo queda preparado sin modificar responsabilidad." },
      { title: "Envía una sola vez", screen: "request", instruction: "Revisa el motivo antes de pulsar Enviar solicitud. Si está vacío, corrige el error. Cancelar permite volver sin enviarla.", result: "Al enviar se registra la petición y se vuelve al detalle con su identificador." },
      { title: "Contrasta el estado", screen: "detail", instruction: "Lee el aviso, Pendiente de evaluación y la responsabilidad vigente. Puedes consultar el evento de la solicitud en seguimiento; la evaluación corresponde a Supervisor.", result: "La petición no ha cambiado al responsable y no se ofrece un envío duplicado mientras esté pendiente." },
    ],
  },
  {
    id: "reasignacion", title: "Evaluar una solicitud de reasignación", description: "Contexto → aprobación o rechazo → confirmación → resultado.",
    roles: ["supervisor"], destination: "requests", entry: "En Solicitudes de reasignación busca por solicitud/expediente y selecciona Evaluar solicitud.",
    caution: "Aprobar cambia al responsable solo al confirmar. Rechazar conserva al responsable anterior. Una solicitud resuelta no admite otra decisión.",
    result: "Decisión visible en detalle y bandeja; aprobación con nuevo responsable o rechazo sin cambio de responsabilidad.", recovery: "La aprobación exige nuevo responsable. El rechazo exige justificación. Cancelar el diálogo no decide y permite corregir; salir de la evaluación descarta lo preparado.",
    steps: [
      { title: "Contrasta la solicitud", screen: "evaluation", instruction: "Revisa expediente, solicitante, responsable al solicitar, fecha, motivo e historial. Comprueba que siga Pendiente de evaluación.", result: "La solicitud permanece sin resolver mientras consultas." },
      { title: "Prepara una de las dos decisiones", screen: "evaluation", instruction: "Para aprobar selecciona nuevo responsable y documenta el sustento. Para rechazar escribe Justificación de la decisión; no necesita nuevo responsable. Pulsa Aprobar o Rechazar.", result: "Si faltan requisitos se indica el error; si están completos aparece el resumen de la decisión.", alternative: "El prototipo permite aprobar con un sustento demo por defecto si no escribes justificación. Para una decisión comprensible, documenta el motivo disponible." },
      { title: "Confirma el efecto", screen: "evaluation", instruction: "Lee si cambiará o se conservará la responsabilidad. Confirma aprobación o rechazo; Cancelar cierra el diálogo sin decidir.", result: "Se registra una única decisión y se muestra el resultado, sin mantener abierta la confirmación." },
      { title: "Comprueba y vuelve", screen: "evaluation", instruction: "Revisa Resultado registrado y la justificación. Usa Volver a la bandeja para comprobar el estado. Si aprobaste, contrasta al responsable en el expediente.", result: "La bandeja conserva sus filtros; la decisión y el historial están actualizados durante esta sesión." },
    ],
  },
  {
    id: "evaluar", title: "Revisar una versión documental", description: "Tarea asignada → observaciones o conformidad → resultado en la versión.",
    roles: ["reviewer"], destination: "reviews", entry: "Desde Revisiones pendientes filtra por referencia o estado y abre una tarea pendiente.",
    caution: "El visor es simulado. Conformidad interna no equivale a resolución legal ni confirmación externa. Vocal no realiza esta tarea.",
    result: "Tarea y versión con Observada o Conformidad interna; no se permite decidir por segunda vez.", recovery: "Emitir observaciones sin fundamentación muestra un error. Cancelar el diálogo conserva la nota; volver al listado sin confirmar la descarta y no registra decisión.",
    steps: [
      { title: "Verifica la identidad asignada", screen: "reviewWorkspace", instruction: "Contrasta tarea, expediente, documento y versión exacta. Lee el visor de ejemplo y los antecedentes disponibles.", result: "Sabes sobre qué versión se aplicaría el resultado, no sobre todas las versiones." },
      { title: "Elige el resultado", screen: "reviewWorkspace", instruction: "Para observar escribe Fundamentación de observaciones y pulsa Emitir observaciones. Para conformidad utiliza Registrar conformidad interna.", result: "Se propone el resultado en un diálogo; todavía no queda registrado." },
      { title: "Confirma o vuelve", screen: "reviewWorkspace", instruction: "Comprueba la versión en el diálogo y pulsa Confirmar resultado. Cancelar conserva la preparación para corregirla.", result: "Se cierra la confirmación y se actualizan tarea y versión de manera conjunta." },
      { title: "Comprueba el cierre de la tarea", screen: "reviewWorkspace", instruction: "Lee Resultado ya registrado y la nota. Vuelve a revisiones y comprueba el estado. Si observaste, Analista continuará creando una nueva versión desde su ámbito.", result: "La tarea resuelta se puede consultar sin emitir otra decisión. No se cambia automáticamente a otro perfil." },
    ],
  },
  {
    id: "intercambio", title: "Registrar y dar seguimiento a una salida", description: "Preparación completa, validación, registro local e historial.",
    roles: ["exchange"], destination: "exchanges", entry: "En Intercambios registrados pulsa Registrar salida. Desde un expediente también puedes iniciar con su referencia completada.",
    caution: "Registrar no envía al destino ni acredita recepción. El archivo de evidencia es una selección simulada, opcional para la salida.",
    result: "Nuevo INT-DEMO en estado Registrado, con un primer intento local y constancia si se indicó.", recovery: "Si faltan datos, Revisar registro no abre la confirmación. Si cambias expediente, vuelve a seleccionar el elemento relacionado. Cancelar descarta el formulario.",
    steps: [
      { title: "Relaciona la salida", screen: "registerExchange", instruction: "Selecciona Expediente asociado y Actuación o documento. Puedes elegir una versión disponible o la actuación operativa del expediente.", result: "La salida queda preparada con su contexto; al cambiar expediente se limpia el elemento relacionado." },
      { title: "Completa el registro", screen: "registerExchange", instruction: "Indica tipo de actuación, canal, destino, fecha/hora y referencia. Incorpora evidencia si corresponde. No declares confirmación externa.", result: "Los campos obligatorios están preparados; evidencia puede permanecer ausente." },
      { title: "Valida y confirma", screen: "registerExchange", instruction: "Pulsa Revisar registro. Corrige faltantes y comprueba Confirmar registro de salida. Confirmar registro interno crea la salida; Volver permite corregir.", result: "Se abre el detalle del nuevo intercambio con aviso de registro local, no de envío exitoso." },
      { title: "Contrasta el historial", screen: "exchangeDetail", instruction: "Revisa Registrado, primer intento, destino y constancia. Ver expediente relacionado abre el contexto; Volver retorna según la procedencia indicada.", result: "La salida queda consultable. Tratar fallo solo aparece para Fallido o Resultado desconocido, no para cualquier estado." },
    ],
  },
  {
    id: "tratamiento", title: "Tratar un fallo o un resultado desconocido", description: "Distinguir reintento y escalamiento sin borrar antecedentes.",
    roles: ["exchange", "analyst"], destination: "exchanges", entry: "Personal documentario parte de Intercambios registrados. Analista consulta intercambios desde el expediente, sin registrar tratamiento.",
    caution: "El tratamiento está habilitado solo para Personal documentario y estados Fallido o Resultado desconocido. No se ejecutan llamadas reales.",
    result: "Nuevo intento añadido con Resultado desconocido y antecedentes conservados, o consulta de lectura para Analista.", recovery: "Si no aparece Tratar fallo, comprueba perfil y estado. No interpretes Registrado o Pendiente de confirmación como fallo. La ausencia de constancia no prueba éxito.",
    steps: [
      { title: "Lee el estado y los intentos", screen: "exchangeDetail", instruction: "Abre el intercambio y revisa su identidad, condición reportada, destino, historial y evidencia.", result: "Puedes distinguir un registro local de una confirmación sustentada y de un resultado desconocido." },
      { title: "Abre el tratamiento autorizado", screen: "exchangeDetail", instruction: "Si eres Personal documentario y el estado corresponde, pulsa Tratar fallo o resultado incierto. Si eres Analista, limita este flujo a consulta y retorno.", result: "Se abre el formulario de nuevo intento sin eliminar el historial.", alternative: "La guía no concede a Analista la atribución de registrar reintento o escalamiento." },
      { title: "Documenta y confirma", screen: "treatExchange", instruction: "Elige Registrar reintento o Registrar escalamiento técnico y escribe Nota del tratamiento. Revisa nuevo intento y confirma el tratamiento. Volver conserva la preparación; Cancelar vuelve sin añadirlo.", result: "Se añade un intento; el escalamiento incorpora referencia técnica. El resultado externo permanece desconocido." },
      { title: "Comprueba el historial íntegro", screen: "exchangeDetail", instruction: "Lee el aviso y cuenta los intentos anteriores y el nuevo. Contrasta fecha, mensaje y referencia. Regresa al expediente o listado de origen.", result: "Los antecedentes siguen disponibles. No se ha fabricado una recepción ni una recuperación externa." },
    ],
  },
  {
    id: "derivacion", title: "Registrar una derivación especial", description: "Motivo, destino, actuación y constancia sin resolver el circuito externo.",
    roles: ["analyst", "exchange"], destination: "locate", entry: "Abre un expediente por localización o tu ámbito autorizado. En Intercambios relacionados pulsa Derivación especial.",
    caution: "El registro no cierra el expediente, no reasigna responsabilidad y no resuelve el procedimiento de otra institución.",
    result: "Derivación DER-DEMO visible como registro interno relacionado y traza conservada.", recovery: "Motivo, destino, actuación y constancia son obligatorios. Sin alguno, Revisar derivación muestra el faltante. Cancelar vuelve al expediente sin registrar.",
    steps: [
      { title: "Confirma el expediente", screen: "detail", instruction: "Revisa la referencia y pulsa Derivación especial. Solo Analista y Personal documentario tienen el acceso en esta demostración.", result: "Se abre un formulario asociado a ese expediente." },
      { title: "Prepara el contexto", screen: "specialDerivation", instruction: "Indica motivo, destino y actuación relacionada. Incorpora constancia con el control de ejemplo; no es una carga de archivo real.", result: "Los cuatro datos de la derivación están preparados, sin ejecutar el procedimiento externo." },
      { title: "Revisa y confirma", screen: "specialDerivation", instruction: "Pulsa Revisar derivación, corrige faltantes y comprueba el diálogo. Confirmar registro interno crea la constancia; Volver permite corregir.", result: "Se añade la derivación y regresas al expediente." },
      { title: "Comprueba su alcance", screen: "detail", instruction: "Lee el aviso y el registro en Intercambios relacionados. Comprueba que sigue indicando Registro interno y que el responsable no cambió por esta acción.", result: "La derivación es consultable sin afirmar un resultado del circuito externo." },
    ],
  },
  {
    id: "trazabilidad", title: "Comprobar una actuación y su evidencia", description: "Filtros → actuación → secuencia → contexto del expediente → retorno.",
    roles: ["auditor"], destination: "evidence", entry: "Entra en Evidencia y trazabilidad con el perfil Auditor.",
    caution: "Esta consulta no certifica firma, sello de tiempo, integridad criptográfica ni validez oficial. Evidencia no disponible no significa confirmación.",
    result: "Actuación contrastada con su origen, disponibilidad y contexto, sin modificar datos.", recovery: "Sin coincidencias, limpia o amplía filtros; con error simulado usa Reintentar. Una referencia de evidencia es texto demostrativo, no un botón de descarga.",
    steps: [
      { title: "Delimita la consulta", screen: "evidence", instruction: "Combina referencia, tipo, fecha, actor/fuente y disponibilidad de evidencia. Selecciona Ver detalle en la actuación que necesitas contrastar.", result: "Abres una traza concreta con su identificador." },
      { title: "Contrasta el origen", screen: "evidenceDetail", instruction: "Lee fecha/hora, actor, origen, expediente, documento y versión. Revisa las actuaciones relacionadas del mismo expediente.", result: "Distingues el dato registrado de campos que no corresponden o no constan." },
      { title: "Revisa la disponibilidad", screen: "evidenceDetail", instruction: "Comprueba Evidencia asociada. Si consta una referencia, contrástala; si no, conserva Evidencia no disponible sin inferir una constancia.", result: "La disponibilidad permanece explícita y no se sustituye por una confirmación inventada." },
      { title: "Amplía contexto y regresa", screen: "detail", instruction: "Ver expediente compartido abre su contexto. Auditor puede consultar sus trazas relacionadas, pero no seguimiento CU-08. Vuelve a trazabilidad desde el expediente o desde la actuación según indique el botón.", result: "Regresas al listado con filtros conservados; no se modificó el expediente ni la traza." },
    ],
  },
  {
    id: "soporte", title: "Documentar una intervención técnica", description: "Historial → actuación → evidencia condicionada → confirmación local.",
    roles: ["support"], destination: "interventions", entry: "En Intervenciones técnicas busca por identificador de intervención o componente, filtra estado y abre Ver intervención.",
    caution: "Soporte es demostrativo y condicionado. No desbloquea usuarios, cambia permisos, accede a servidores ni reinicia servicios.",
    result: "Nueva actuación en historial y estado local actualizado; no una reparación institucional ejecutada.", recovery: "Completa etapa, descripción y resultado. Recuperación comprobada exige evidencia; los demás resultados no la exigen. Cancelar no añade actuación.",
    steps: [
      { title: "Lee antes de registrar", screen: "interventionDetail", instruction: "Revisa componente, estado, resultado y actuaciones previas. Pulsa Registrar actuación técnica si corresponde.", result: "Se abre una nueva preparación sin alterar el historial anterior." },
      { title: "Describe lo comprobado", screen: "technicalAction", instruction: "Selecciona Etapa, describe la actuación o condición observada y elige Resultado registrado. Para Recuperación comprobada usa Incorporar evidencia demostrativa.", result: "Los datos reflejan lo comprobado, diferenciando verificación pendiente, recuperación parcial y resultado desconocido." },
      { title: "Valida y confirma", screen: "technicalAction", instruction: "Pulsa Revisar actuación. Corrige requisitos y revisa el diálogo. Confirmar registro técnico añade el antecedente; Volver conserva el formulario.", result: "Se actualiza el detalle con una actuación local; no se ejecuta una operación sobre infraestructura." },
      { title: "Comprueba y retorna", screen: "interventionDetail", instruction: "Lee el aviso, nuevo estado e historial. Contrasta descripción, resultado, evidencia y actor. Vuelve a intervenciones.", result: "Las actuaciones anteriores permanecen y se conservan los filtros del listado." },
    ],
  },
  {
    id: "vocal", title: "Comprender el acceso condicionado", description: "Reconocer el ámbito disponible y los límites de esta demostración.",
    roles: ["vocal"], destination: "reviews", entry: "Accede con la cuenta demo de Vocal. El encabezado identifica Vocal · STK-04 (condicionado).",
    caution: "La asistencia no habilita atribuciones ni permite actuar como Revisor. No cambies de rol para evitar un control de acceso.",
    result: "Conoces el límite del perfil sin haber emitido revisiones ni modificado expedientes.", recovery: "Acceso no autorizado es una restricción explícita, no una tarea que se complete con el recorrido. Las actuaciones de este perfil requieren definición e integración institucional posteriores.",
    steps: [
      { title: "Reconoce el perfil", screen: "reviews", instruction: "Comprueba Vocal y su condición en el selector de demostración.", result: "Sabes qué perfil estás explorando; no representa autenticación institucional." },
      { title: "Lee la restricción", screen: "reviews", instruction: "Revisa el mensaje del espacio de revisiones y la ausencia de tareas habilitadas.", result: "No se ofrecen controles de decisión para Vocal." },
      { title: "Consulta sin habilitar", screen: "reviews", instruction: "Usa Ayuda y guías o repite la orientación para comprender el límite. Consultar ayuda no lo modifica.", result: "Puedes orientarte sin ejecutar una actuación de otro perfil." },
      { title: "Finaliza la demostración", screen: "reviews", instruction: "Utiliza Salir si terminaste. Volverás al acceso de demostración, no a un servicio institucional.", result: "La sesión demo finaliza sin registrar una revisión." },
    ],
  },
]

export function guideDestination(guide: Guide, actor: Actor): NavigationId {
  if (guide.id === "expediente" || guide.id === "documentos") return actor === "auditor" ? "evidence" : "locate"
  if (guide.id === "tratamiento" && actor === "analyst") return "pending"
  return guide.destination
}
