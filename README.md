# Programowanie Aplikacji w Chmurze Obliczeniowej - Zadanie 1
## Część obowiązkowa
### 1. Budowa obrazu
```bash
docker build -t pogoda-app:1.0 .
```
![build](img/img_p/build.png)

### 2. Sprawdzenie liczby warstw i rozmiaru obrazu
```bash
docker image inspect weather-app:1.0 --format='Warstwy: {{len .RootFS.Layers}}, Rozmiar: {{.Size}} bajtów'
```
![inspect](img/img_p/inspect.png)

### 3. Uruchomienie kontenera
```bash
docker run -d -p 3000:3000 --name weather-app weather-app:1.0
```
![run](img/img_p/run.png)

### 4. Wyświetlenie logów
```bash
docker logs weather-app
```
![logs](img/img_p/logs.png)

### 5. Działanie aplikacji
![app1](img/img_p/app1.png)
![app2](img/img_p/app2.png)

## Zadanie dodatkowe nr 3
### 1. Utworzenie i konfiguracja buildera
```bash
docker buildix create --use --name weather-builder
docker buildx inspect weather-builder --bootstrap
```
![buildx](img/img_d/buildx.png)

### 2. Budowanie obrazu
```bash
docker buildx build --file Dockerfile2 --platform linux/amd64,linux/arm64 --ssh default --build-arg BUILDKIT_INLINE_CACHE=1 --cache-from=type=registry,ref=michumgw/weather-app:cache --cache-to=type=registry,ref=michumgw/weather-app:cache,mode=max -t michumgw/weather-app:latest --push .
```
![build](img/img_d/build.png)

### 3. Potwierdzenie, że manifest zawiera deklaracje dla platformy linux/amd64 i linux/arm64
```bash
docker buildx imagetools inspect michumgw/weather-app:latest
```
![inspect](img/img_d/inspect.png)

### 4. Sprawdzenie obrazu pod kątem podatności na zagrożenia
```bash
docker scout cves --platform linux/arm64 michumgw/weather-app:latest --only-severity=critical,high
```

### 5. Wynik analizy
![scout](img/img_d/scout.png)
> W obrazie wykryto jedną podatność typu HIGH: CVE-2024-21538 w bibliotece `cross-spawn@7.0.3`.  
> Zagrożenie dotyczy złożoności wyrażeń regularnych (ReDoS), ale biblioteka nie jest wykorzystywana bezpośrednio przez aplikację, ani w żadnym miejscu aplikacja nie przyjmuje danych wejściowych użytkownika do dynamicznego tworzenia poleceń systemowych.  
> `cross-spawn` jest zależnością pośrednią, a funkcjonalność, której dotyczy luka, nie jest aktywnie wykorzystywana w aplikacji.  
> W związku z tym podatność można uznać za **nieistotną** w kontekście tej aplikacji.

### 6. Potwierdzenie wykorzystania danych cache przy budowie obrazu
> Do określenia, czy podczas budowy obrazu wykorzystane zostały dane cache, posłużyłem się logami z procesu budowy obrazu
#### Pierwsza budowa obrazu:
![build1](img/img_d/build1.png)
#### Druga budowa obrazu:
![build2](img/img_d/build2.png)

### 7. Potwierdzenie umieszczenia obrazu na dockerhub
![dockerhub](img/img_d/dockerhub.png)

