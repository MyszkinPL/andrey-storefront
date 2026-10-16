import { useState } from 'react';
import {
  Button,
  Cluster,
  List,
  ListItem,
  ListGroup,
  ListGroupItem,
  Pill,
  Spinner,
  Stack,
  Subnav,
  SubnavItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Truncated,
} from '../../index';
import type { CatalogEntry } from '../types';

function SpinnerStates() {
  return (
    <Cluster gap="4" align="center">
      <Spinner size="sm" label="Загрузка (sm)" />
      <Spinner label="Загрузка" />
      <Spinner size="lg" label="Загрузка (lg)" />
      <Button variant="ghost" disabled loading>
        Сохранение
      </Button>
    </Cluster>
  );
}

const listRows = [
  { id: 1, title: 'Квитанция за март', meta: 'Оплачена', amount: '4 120 ₽' },
  { id: 2, title: 'Квитанция за апрель', meta: 'В обработке', amount: '4 380 ₽' },
  { id: 3, title: 'Квитанция за май', meta: 'Черновик', amount: '—' },
];

function ListStates() {
  const [selectedId, setSelectedId] = useState<number | null>(2);
  const [checked, setChecked] = useState<Record<number, boolean>>({ 1: true });
  return (
    <Stack gap="4">
      <List>
        {listRows.map((row) => (
          <ListItem
            key={row.id}
            selected={selectedId === row.id}
            onSelect={() => setSelectedId(row.id)}
            checked={!!checked[row.id]}
            onCheckedChange={(next) => setChecked((prev) => ({ ...prev, [row.id]: next }))}
          >
            <Stack gap="1">
              <Text size="sm">{row.title}</Text>
              <Text size="xs" tone="muted">
                {row.meta}
              </Text>
            </Stack>
            <Text size="sm" monospace>
              {row.amount}
            </Text>
          </ListItem>
        ))}
      </List>
      <List size="small">
        <ListItem>
          <Text size="xs">Маленькая строка (size=small, без чекбокса)</Text>
        </ListItem>
        <ListItem>
          <Text size="xs">Вторая маленькая строка</Text>
        </ListItem>
      </List>
    </Stack>
  );
}

function ListGroupStates() {
  return (
    <ListGroup>
      <ListGroupItem>
        <Stack gap="1">
          <Text size="sm">Тариф «Базовый»</Text>
          <Text size="xs" tone="muted">
            5 проектов, 1 ГБ хранилища
          </Text>
        </Stack>
      </ListGroupItem>
      <ListGroupItem>
        <Stack gap="1">
          <Text size="sm">Тариф «Команда»</Text>
          <Text size="xs" tone="muted">
            Без лимита проектов, 100 ГБ хранилища
          </Text>
        </Stack>
      </ListGroupItem>
    </ListGroup>
  );
}

function SubnavStates() {
  const [active, setActive] = useState('overview');
  const sections = [
    { id: 'overview', label: 'Обзор' },
    { id: 'invoices', label: 'Счета' },
    { id: 'payments', label: 'Платежи' },
    { id: 'settings', label: 'Настройки' },
  ];
  return (
    <Stack gap="3">
      <Subnav label="Разделы биллинга">
        {sections.map((section) => (
          <SubnavItem key={section.id} active={active === section.id}>
            <a
              href="#subnav-demo"
              onClick={(event) => {
                event.preventDefault();
                setActive(section.id);
              }}
            >
              {section.label}
            </a>
          </SubnavItem>
        ))}
      </Subnav>
      <Text size="xs" tone="muted">
        Активная секция: {sections.find((s) => s.id === active)?.label}
      </Text>
    </Stack>
  );
}

function TruncatedStates() {
  const long =
    'Очень длинное название счёта-фактуры, которое не помещается в отведённую ширину контейнера и обрезается с многоточием';
  return (
    <Stack gap="3">
      <div style={{ maxWidth: 320 }}>
        <Truncated>
          <Text size="sm">{long}</Text>
        </Truncated>
      </div>
      <div style={{ maxWidth: 320 }}>
        <Truncated lines={2} tooltip={long}>
          <Text size="sm">{long}</Text>
        </Truncated>
      </div>
      <div style={{ maxWidth: 320 }}>
        <Truncated>
          <Text size="sm">Короткий текст — тултип не появится</Text>
        </Truncated>
      </div>
    </Stack>
  );
}

const tableRows = [
  { id: 'INV-001', customer: 'ООО «Полярная звезда»', status: 'Оплачен', amount: '128 400 ₽' },
  { id: 'INV-002', customer: 'ИП Морозов А. С.', status: 'Ожидает', amount: '36 900 ₽' },
  { id: 'INV-003', customer: 'АО «Северный поток»', status: 'Просрочен', amount: '254 000 ₽' },
];

function TableStates() {
  const [selected, setSelected] = useState<Record<string, boolean>>({ 'INV-002': true });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Счёт</TableHead>
          <TableHead scope="col">Клиент</TableHead>
          <TableHead scope="col">Статус</TableHead>
          <TableHead scope="col">Сумма</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableRows.map((row) => (
          <TableRow
            key={row.id}
            selected={!!selected[row.id]}
            onClick={() => setSelected((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
          >
            <TableCell>
              <Text size="sm" monospace>
                {row.id}
              </Text>
            </TableCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>
              <Pill color={row.status === 'Оплачен' ? 'green' : row.status === 'Ожидает' ? 'yellow' : 'red'}>
                {row.status}
              </Pill>
            </TableCell>
            <TableCell>
              <Text size="sm" monospace>
                {row.amount}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'Spinner',
    category: 'Feedback',
    description: 'Порт orbit/Spinner: три размера (16/20/24), вращение 1s linear, трек 25% + дуга 75%.',
    variants: [{ name: 'Размеры и кнопка с loading', preview: <SpinnerStates /> }],
  },
  {
    name: 'List',
    category: 'Data display',
    description: 'Порт orbit/List: панель строк с разделителями, выбор строки, чекбокс проявляется на hover/фокусе/отметке.',
    variants: [{ name: 'Выбор и чекбоксы, size small', preview: <ListStates /> }],
  },
  {
    name: 'ListGroup',
    category: 'Layout',
    description: 'Порт orbit/ListGroup: кольцо 1px, радиус 16px, элементы с паддингом 20px и разделителями.',
    variants: [{ name: 'Группа карточек', preview: <ListGroupStates /> }],
  },
  {
    name: 'Subnav',
    category: 'Navigation',
    description: 'Порт orbit/Subnav: ряд ссылок секций, активная — text-primary, hover-переход 120ms, типографика heading-xxs.',
    variants: [{ name: 'Секции биллинга', preview: <SubnavStates /> }],
  },
  {
    name: 'Truncated',
    category: 'Data display',
    description: 'Порт orbit/Truncated на Base UI Tooltip: тултип только при реальном переполнении, lines=1 или line-clamp.',
    variants: [{ name: '1 строка, 2 строки, без переполнения', preview: <TruncatedStates /> }],
  },
  {
    name: 'Table',
    category: 'Data display',
    description: 'Порт orbit ui/table: обёртка overflow-auto, th h-12 muted, строки hover bg-muted/50 и data-selected.',
    variants: [{ name: 'Счета (клик по строке — выделение)', preview: <TableStates /> }],
  },
];
