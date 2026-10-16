import { useState } from 'react';
import { Pill, Cluster, Container, Heading, Stack, Switch, Text, setTheme } from './index';
import { ComponentCatalog } from './catalog/ComponentCatalog';

export default function App() {
  const [dark, setDark] = useState(true);

  return (
    <Container width="xl">
      <Stack gap="8">
        <Cluster gap="3" align="center">
          <Heading size="lg" as="h1">sealui</Heading>
          <Pill color="blue">Polar design · Base UI behavior</Pill>
          <div className="seal-theme-control">
            <Text size="xs" tone="muted">Тема</Text>
            <Switch
              checked={dark}
              onCheckedChange={(checked) => {
                setDark(checked);
                setTheme(checked ? 'dark' : 'light');
              }}
            />
          </div>
        </Cluster>
        <Text tone="muted" size="sm">
          Живой каталог автоматически собирает все файлы `*.stories.tsx` и их варианты. Чтобы добавить новый компонент, создай его story-модуль — реестр, App и импорты витрины менять не нужно.
        </Text>
        <ComponentCatalog />
      </Stack>
    </Container>
  );
}
