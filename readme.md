para modificar la ruta a la que se le puede hacer fetch tienes que cambiar:

android\app\src\main\res\xml\network_security_config.xml
incluir subdominios con
<domain includeSubdomains="true">IP_DOMINIO</domain>
y cambiar la url del fetch para que coincida con la ruta actual.
Al menos hasta que el binding de IP sea fijo
