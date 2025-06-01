# Programowanie Aplikacji w Chmurze Obliczeniowej - Zadanie 2

## 1.Cel zadania
Celem zadania było opracowanie łańcucha znaków w GitHub Actions, który:
- Buduje obraz kontenera na podstawie Dockerfile i kodu z zadania nr 1,
- Wspiera architektury `linux/amd64` i `linux/arm64`,
- Wykorzystuje cache (eksporter: registry, backend: registry, tryb: max),
- Wysyła cache do dedykowanego, publicznego repozytorium na DockerHub,
- Przeprowadza skan bezpieczeństwa obrazu (CVE) za pomocą Trivy i **publikuje obraz tylko jeśli nie zawiera błędów CRITICAL lub HIGH**.

## 2.Sposób tagowania

Obrazy tagowane są w następujący sposób:
- v* - wersja aplikacji na podstawie wypchniętego taga
- latest - zawsze wskazuje na najnowszy, aktualnie zbudowany obraz

Przyjęto konwencję tagów vX.Y.Z, zgodnie z zasadami semver z racji, iż jest to powszechnie stosowany standard wersjonowania obrazów. Format vX.Y.Z:
- X - przełomowe zmiany, jak np. całkowita zmiana API
- Y - nowe funkcje, bez psucia wstecznej kompatybilności
- Z - bugfixy, poprawki bezpieczeństwa

Cache tagowany jest tagiem `buildkit`, gdyż obraz z cachem nie jest wersją aplikacji, a zasobem pomocniczym, który nie musi być wersjonowany jak aplikacja.

## 3.Dodane do repozytorium secrety

[!img](img/secrets.png)

## 4.Struktura opracowanego łańcucha znaków

### Główna struktura

- Nazwa workflowu
```yml
name: Build and Push Docker Image
```

- Ustawienie triggera - workflow uruchamia się w momencie pushowania tagu zaczynającego się od "v".
```yml
on:
  push:
    tags:
      - 'v*'
```

### JOB: build

- Definicja zadania o nazwie Build and Push Multi-Arch Image. Jako runner ustawiono Ubuntu z minimalnymi uprawnieniami do publikacji obrazu na ghcr.io
```yml
jobs:
  build:
    name: Build and Push Multi-Arch Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
```

### Kroki

- Pobranie kodu z repozytorium w celu umożliwienia zbudowania obrazu z plików
```yml
- name: Checkout code
  uses: actions/checkout@v4
```

- Wyciągnięcie wersji z taga i zapisanie jej do zmiennej VERSION
```yml
- name: Extract version from tag
  id: extract_tag
  run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
```

- Konfiguracja buildx w celu zbudowania obrazów na dwie różne architektury
```yml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

- Logowanie do ghcr.io z użyciem zdefiniowanych w repozytorium secretów
```yml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ secrets.GH_USERNAME }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

- Logowanie do DockerHuba z użyciem secretów w celu pobierania i zapisywania cache
```yml
- name: Login to DockerHub (for cache)
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

- Budowanie i wypychanie obrazu z cache
    - **platforms:** wybór platform `linux/amd64` i `linux/arm64`
    - **tags:** Nadanie tagów `v*` i `latest`
    - **cache-from** i **cache-to**: użycie cache z dockerhuba
```yml
- name: Build and push image (with cache)
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    platforms: linux/amd64,linux/arm64
    tags: |
      ghcr.io/${{ secrets.GH_USERNAME }}/pawcho:${{ steps.extract_tag.outputs.VERSION }}
      ghcr.io/${{ secrets.GH_USERNAME }}/pawcho:latest
    cache-from: type=registry,ref=docker.io/${{ secrets.DOCKERHUB_USERNAME }}/cache:buildkit
    cache-to: type=registry,ref=docker.io/${{ secrets.DOCKERHUB_USERNAME }}/cache:buildkit,mode=max
    provenance: false
    sbom: false
```

- Skan CVE z Trivy - zgodnie z zadaniem nr 1 dodany został plik `.trivyignore` zawierający informacje o ignorowanej luce `CVE-2024-21538`, posiadającej poziom HIGH. Luka ta jest niemożliwa do zexploitowania przez użytkownika aplikacji, zatem jest ona ignorowana w procesie skanowania.
```yml
  - name: Install Trivy
    uses: aquasecurity/trivy-action@0.30.0
    with:
      scan-type: image
      image-ref: ghcr.io/${{ secrets.GH_USERNAME }}/pawcho:${{ steps.extract_tag.outputs.VERSION }}
      ignore-unfixed: true
      severity: CRITICAL,HIGH
      trivyignores: .trivyignore
      format: table
      exit-code: 1
```

- Krok, który kończy workflow z błędem i nie publikuje obrazu w momencie wykrycia luki przez Trivy
```yml
- name: Fail if vulnerabilities found
  if: failure()
  run: echo "High or Critical vulnerabilities found. Failing build." && exit 1
```

## 5.Potwierdzenie działania przygotowanego łańcucha znaków

- Przechowywanie danych cache w repozytorium DockerHub:

[!img](img/dockerhub.png)

- Przebiegi workflow'ów:

[!img](img/actions1.png)

- Przebieg ostatniego workflow'a:

[!img](img/actions2.png)

- Utworzone obrazy na ghcr.io:

[!img](img/ghcr.png)
 

