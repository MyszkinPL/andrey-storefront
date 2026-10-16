/**
 * sealui — публичный API.
 * Закрытая система: компоненты принимают только enum-пропсы,
 * кастомные className/style извне недоступны.
 */

export { Accordion } from './components/Accordion';
export type { AccordionProps, AccordionItemData } from './components/Accordion';

export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Input, Textarea } from './components/Input';
export type { InputProps, TextareaProps } from './components/Input';

export { Separator } from './components/Separator';
export type { SeparatorProps, SeparatorState } from './components/Separator';

export {
  Select,
  SelectParts,
  SelectRoot,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectPositioner,
  SelectPopup,
  SelectList,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectArrow,
  SelectScrollUpArrow,
  SelectScrollDownArrow,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
} from './components/Select';
export type {
  SelectProps,
  SelectOption,
  SelectRootProps,
  SelectLabelProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIconProps,
  SelectPortalProps,
  SelectBackdropProps,
  SelectPositionerProps,
  SelectPopupProps,
  SelectListProps,
  SelectItemProps,
  SelectItemIndicatorProps,
  SelectItemTextProps,
  SelectArrowProps,
  SelectScrollUpArrowProps,
  SelectScrollDownArrowProps,
  SelectGroupProps,
  SelectGroupLabelProps,
  SelectSeparatorProps,
  SelectChangeEventDetails,
  SelectChangeEventReason,
  SelectItemState,
  SelectTriggerState,
  SelectValueState,
  SelectPositionerState,
  SelectPopupState,
  SelectRootActions,
  SelectRootState,
  SelectIconState,
  SelectPortalState,
  SelectBackdropState,
  SelectItemIndicatorState,
  SelectItemTextState,
  SelectArrowState,
  SelectScrollUpArrowState,
  SelectScrollDownArrowState,
  SelectListState,
  SelectGroupState,
  SelectGroupLabelState,
  SelectSeparatorState,
} from './components/Select';

export {
  Combobox,
  ComboboxParts,
  ComboboxRoot,
  ComboboxLabel,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxIcon,
  ComboboxClear,
  ComboboxValue,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxPortal,
  ComboboxBackdrop,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxArrow,
  ComboboxStatus,
  ComboboxEmpty,
  ComboboxList,
  ComboboxRow,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxSeparator,
  ComboboxCollection,
  useComboboxFilter,
  useComboboxFilteredItems,
  createComboboxItems,
} from './components/Combobox';
export type {
  ComboboxProps,
  ComboboxRootProps,
  ComboboxValueProps,
  ComboboxCollectionProps,
  ComboboxLabelProps,
  ComboboxInputGroupProps,
  ComboboxInputProps,
  ComboboxTriggerProps,
  ComboboxIconProps,
  ComboboxClearProps,
  ComboboxPortalProps,
  ComboboxBackdropProps,
  ComboboxPositionerProps,
  ComboboxPopupProps,
  ComboboxArrowProps,
  ComboboxListProps,
  ComboboxStatusProps,
  ComboboxEmptyProps,
  ComboboxItemProps,
  ComboboxItemIndicatorProps,
  ComboboxGroupProps,
  ComboboxGroupLabelProps,
  ComboboxSeparatorProps,
  ComboboxRowProps,
  ComboboxChipsProps,
  ComboboxChipProps,
  ComboboxChipRemoveProps,
} from './components/Combobox';

export { AlertDialog } from './components/AlertDialog';
export type { AlertDialogProps } from './components/AlertDialog';

export { Dialog } from './components/Dialog';
export type { DialogProps } from './components/Dialog';

export { Tabs, TabsPanel } from './components/Tabs';
export type { TabsProps, TabsPanelProps, TabItem } from './components/Tabs';

export { Avatar, getInitials } from './components/Avatar';
export type { AvatarProps, AvatarSize, AvatarRootProps, AvatarImageProps, AvatarFallbackProps, AvatarImageLoadingStatus } from './components/Avatar';

export { Pill, Status } from './components/Pill';
export type { PillProps, PillColor, StatusProps, StatusColor, StatusSize } from './components/Pill';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { Collapsible } from './components/Collapsible';
export type { CollapsibleProps } from './components/Collapsible';

export { CheckboxGroup } from './components/CheckboxGroup';
export type { CheckboxGroupProps, CheckboxGroupItem, CheckboxGroupLeaf } from './components/CheckboxGroup';

export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';

export { Field } from './components/Field';
export type { FieldProps, FieldValidationMode } from './components/Field';

export { Fieldset } from './components/Fieldset';
export type { FieldsetProps } from './components/Fieldset';

export { Form } from './components/Form';
export type { FormProps, FormValidationMode } from './components/Form';

export { Card, Setting } from './components/Card';
export type { CardProps, SettingProps } from './components/Card';

export { Text, Heading } from './components/Text';
export type { TextProps, TextSize, TextTone, HeadingProps, HeadingSize } from './components/Text';

export { Stack, Cluster, Container, SPACE } from './layouts/Stack';
export type { StackProps, ClusterProps, ContainerProps, Space, ClusterJustify, ContainerWidth } from './layouts/Stack';

export { Banner } from './components/Banner';
export type { BannerProps, BannerVariant, BannerAction } from './components/Banner';

export { Well, WellHeader, WellContent, WellFooter } from './components/Well';
export type { WellProps, WellHeaderProps, WellHeaderLayout, WellContentProps, WellFooterProps } from './components/Well';

export { DetailRow } from './components/DetailRow';
export type { DetailRowProps } from './components/DetailRow';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './components/EmptyState';

export { StatisticCard } from './components/StatisticCard';
export type { StatisticCardProps, StatisticCardSize } from './components/StatisticCard';

export { ButtonGroup } from './components/ButtonGroup';
export type { ButtonGroupProps, ButtonGroupActions, ButtonGroupAction, ButtonGroupSize } from './components/ButtonGroup';

export { Toolbar, ToolbarButton, ToolbarLink, ToolbarInput, ToolbarGroup } from './components/Toolbar';
export { ToolbarSeparator } from './components/Toolbar';
export type { ToolbarProps, ToolbarOrientation, ToolbarButtonProps, ToolbarButtonVariant, ToolbarLinkProps, ToolbarInputProps, ToolbarGroupProps } from './components/Toolbar';

export { Popover, PopoverTitle, PopoverDescription, PopoverClose } from './components/Popover';
export type { PopoverProps, PopoverSide, PopoverAlign } from './components/Popover';

export { FilterPopover } from './components/FilterPopover';
export type { FilterPopoverProps, Filter, FilterBase, FilterOption, SingleFilter, MultiFilter } from './components/FilterPopover';

export { Timeline, formatRelativeTime } from './components/Timeline';
export type { TimelineProps, TimelineEntryData, TimelineSentiment } from './components/Timeline';

export { MoneyInput } from './components/MoneyInput';
export type { MoneyInputProps } from './components/MoneyInput';

export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress';

export { RadioGroup, RadioItem } from './components/Radio';
export type { RadioGroupProps, RadioItemProps } from './components/Radio';

export { SegmentedControl } from './components/SegmentedControl';
export type { SegmentedControlProps, SegmentedOption, SegmentedSize, SegmentedVariant } from './components/SegmentedControl';

export {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuGroup,
} from './components/Menu';
export type {
  MenuProps,
  MenuSide,
  MenuAlign,
  MenuItemProps,
  MenuLinkItemProps,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuGroupProps,
} from './components/Menu';

export { Toggle } from './components/Toggle';
export type { ToggleProps } from './components/Toggle';

export { Paginator } from './components/Paginator';
export type { PaginatorProps } from './components/Paginator';

export { setTheme, getTheme } from './theme';
export type { Theme } from './theme';

// ==== SEAL WAVE 3 — новые экспорты (область на одного воркера) ====
// @seal:w1:start
export {
  Drawer,
  DrawerParts,
  DrawerRoot,
  DrawerProvider,
  DrawerIndentBackground,
  DrawerIndent,
  DrawerTrigger,
  DrawerSwipeArea,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerVirtualKeyboardProvider,
  createDrawerHandle,
} from './components/Drawer';
export type {
  DrawerProps,
  DrawerSide,
  DrawerSwipeDirection,
  DrawerHandle,
  DrawerRootProps,
  DrawerProviderProps,
  DrawerTriggerProps,
  DrawerPortalProps,
  DrawerBackdropProps,
  DrawerViewportProps,
  DrawerViewportOwnProps,
  DrawerPopupProps,
  DrawerContentProps,
  DrawerTitleProps,
  DrawerDescriptionProps,
  DrawerCloseProps,
  DrawerSwipeAreaProps,
  DrawerIndentProps,
  DrawerIndentBackgroundProps,
  DrawerVirtualKeyboardProviderProps,
} from './components/Drawer';

export {
  ScrollArea,
  ScrollAreaParts,
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
} from './components/ScrollArea';
export type {
  ScrollAreaProps,
  ScrollAreaSize,
  ScrollAreaOrientation,
  ScrollAreaRootProps,
  ScrollAreaViewportProps,
  ScrollAreaContentProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaCornerProps,
} from './components/ScrollArea';

export {
  PreviewCard,
  PreviewCardParts,
  PreviewCardRoot,
  PreviewCardTrigger,
  PreviewCardPortal,
  PreviewCardPositioner,
  PreviewCardPopup,
  PreviewCardArrow,
  PreviewCardBackdrop,
  PreviewCardViewport,
  createPreviewCardHandle,
} from './components/PreviewCard';
export type {
  PreviewCardProps,
  PreviewCardSide,
  PreviewCardAlign,
  PreviewCardHandle,
  PreviewCardRootProps,
  PreviewCardTriggerProps,
  PreviewCardPortalProps,
  PreviewCardPositionerProps,
  PreviewCardPopupProps,
  PreviewCardArrowProps,
  PreviewCardBackdropProps,
  PreviewCardViewportProps,
} from './components/PreviewCard';
// @seal:w1:end
// @seal:w2:start
export {
  ContextMenu,
  ContextMenuParts,
  ContextMenuSubmenu,
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuBackdrop,
  ContextMenuPositioner,
  ContextMenuPopup,
  ContextMenuArrow,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuDestructiveItem,
  ContextMenuLinkItem,
  ContextMenuCheckboxItem,
  ContextMenuCheckboxItemIndicator,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRadioItemIndicator,
  ContextMenuSeparator,
  ContextMenuSubmenuRoot,
  ContextMenuSubmenuTrigger,
} from './components/ContextMenu';
export type {
  ContextMenuProps,
  ContextMenuSubmenuProps,
  ContextMenuSide,
  ContextMenuAlign,
  ContextMenuRootProps,
  ContextMenuTriggerProps,
  ContextMenuPortalProps,
  ContextMenuBackdropProps,
  ContextMenuPositionerProps,
  ContextMenuPopupProps,
  ContextMenuArrowProps,
  ContextMenuGroupProps,
  ContextMenuGroupLabelProps,
  ContextMenuItemProps,
  ContextMenuLinkItemProps,
  ContextMenuCheckboxItemProps,
  ContextMenuCheckboxItemIndicatorProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuRadioItemIndicatorProps,
  ContextMenuSeparatorProps,
  ContextMenuSubmenuRootProps,
  ContextMenuSubmenuTriggerProps,
} from './components/ContextMenu';

export {
  Menubar,
  MenubarParts,
  MenubarMenu,
  MenubarMenuButton,
  MenubarTrigger,
  MenubarPortal,
  MenubarPositioner,
  MenubarPopup,
  MenubarArrow,
  MenubarSeparator,
  MenubarItem,
  MenubarLinkItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarGroup,
} from './components/Menubar';
export type {
  MenubarProps,
  MenubarMenuProps,
  MenubarMenuButtonProps,
  MenubarTriggerProps,
  MenubarPortalProps,
  MenubarPositionerProps,
  MenubarPopupProps,
  MenubarArrowProps,
  MenubarItemProps,
  MenubarLinkItemProps,
  MenubarCheckboxItemProps,
  MenubarRadioGroupProps,
  MenubarGroupProps,
} from './components/Menubar';

export {
  NavigationMenuParts,
  NavigationMenuBar,
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuIcon,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuPortal,
  NavigationMenuBackdrop,
  NavigationMenuPositioner,
  NavigationMenuPopup,
  NavigationMenuArrow,
  NavigationMenuViewport,
  NavigationMenuLinkList,
  NavigationMenuLinkItem,
  NavigationMenuLinkTitle,
  NavigationMenuLinkDescription,
} from './components/NavigationMenu';
export type {
  NavigationMenuBarProps,
  NavigationMenuSection,
  NavigationMenuLinkCard,
  NavigationMenuRootProps,
  NavigationMenuListProps,
  NavigationMenuItemProps,
  NavigationMenuTriggerProps,
  NavigationMenuIconProps,
  NavigationMenuContentProps,
  NavigationMenuLinkProps,
  NavigationMenuPortalProps,
  NavigationMenuBackdropProps,
  NavigationMenuPositionerProps,
  NavigationMenuPopupProps,
  NavigationMenuArrowProps,
  NavigationMenuViewportProps,
} from './components/NavigationMenu';
// @seal:w2:end
// @seal:w3:start
export {
  NumberField,
  NumberFieldParts,
  NumberFieldRoot,
  NumberFieldScrubArea,
  NumberFieldScrubAreaCursor,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldInput,
  NumberFieldIncrement,
} from './components/NumberField';
export type {
  NumberFieldProps,
  NumberFieldRootProps,
  NumberFieldScrubAreaProps,
  NumberFieldScrubAreaCursorProps,
  NumberFieldGroupProps,
  NumberFieldDecrementProps,
  NumberFieldInputProps,
  NumberFieldIncrementProps,
} from './components/NumberField';

export { OTPField, OTPFieldParts, OTPFieldRoot, OTPFieldInput, OTPFieldSeparator } from './components/OTPField';
export type {
  OTPFieldProps,
  OTPFieldRootProps,
  OTPFieldInputProps,
  OTPFieldSeparatorProps,
} from './components/OTPField';

export { Meter, MeterParts, MeterRoot, MeterLabel, MeterValue, MeterTrack, MeterIndicator } from './components/Meter';
export type {
  MeterProps,
  MeterRootProps,
  MeterLabelProps,
  MeterValueProps,
  MeterTrackProps,
  MeterIndicatorProps,
} from './components/Meter';
// @seal:w3:end
// @seal:w4:start

export {
  Slider,
  SliderParts,
  SliderRoot,
  SliderLabel,
  SliderValue,
  SliderControl,
  SliderTrack,
  SliderIndicator,
  SliderThumb,
} from './components/Slider';
export type {
  SliderProps,
  SliderRootProps,
  SliderLabelProps,
  SliderValueProps,
  SliderControlProps,
  SliderTrackProps,
  SliderIndicatorProps,
  SliderThumbProps,
} from './components/Slider';

export {
  ToastProvider,
  Toaster,
  ToastParts,
  ToastRoot,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  ToastPortal,
  ToastViewport,
  ToastPositioner,
  ToastArrow,
  useToast,
  createToastManager,
} from './components/Toast';
export type {
  ToasterProps,
  ToastProviderProps,
  ToastVariant,
  ToastPosition,
  ToastRootProps,
  ToastContentProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
  ToastPortalProps,
  ToastViewportProps,
  ToastPositionerProps,
  ToastArrowProps,
} from './components/Toast';

export {
  Autocomplete,
  AutocompleteParts,
  AutocompleteRoot,
  AutocompleteInputGroup,
  AutocompleteInput,
  AutocompleteTrigger,
  AutocompleteIcon,
  AutocompleteClear,
  AutocompleteValue,
  AutocompletePortal,
  AutocompleteBackdrop,
  AutocompletePositioner,
  AutocompletePopup,
  AutocompleteArrow,
  AutocompleteStatus,
  AutocompleteEmpty,
  AutocompleteList,
  AutocompleteRow,
  AutocompleteItem,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteSeparator,
  AutocompleteCollection,
  useAutocompleteFilter,
  useAutocompleteFilteredItems,
} from './components/Autocomplete';
export type {
  AutocompleteOption,
  AutocompleteProps,
  AutocompleteRootProps,
  AutocompleteValueProps,
  AutocompleteTriggerProps,
  AutocompleteInputProps,
  AutocompleteInputGroupProps,
  AutocompleteIconProps,
  AutocompleteClearProps,
  AutocompleteListProps,
  AutocompleteStatusProps,
  AutocompletePortalProps,
  AutocompleteBackdropProps,
  AutocompletePositionerProps,
  AutocompletePopupProps,
  AutocompleteArrowProps,
  AutocompleteGroupProps,
  AutocompleteGroupLabelProps,
  AutocompleteItemProps,
  AutocompleteRowProps,
  AutocompleteCollectionProps,
  AutocompleteEmptyProps,
  AutocompleteSeparatorProps,
  AutocompleteGroupEntry,
  AutocompleteItemsInput,
} from './components/Autocomplete';

// @seal:w4:end
// @seal:w5:start
// Popover — недостающие части Base UI 1.8 (Backdrop, Viewport, Handle)
export {
  PopoverParts,
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverBackdrop,
  PopoverPositioner,
  PopoverPopup,
  PopoverArrow,
  PopoverViewport,
  createPopoverHandle,
} from './components/Popover';
export type {
  PopoverHandle,
  PopoverRootProps,
  PopoverRootState,
  PopoverRootActions,
  PopoverRootChangeEventReason,
  PopoverRootChangeEventDetails,
  PopoverTriggerProps,
  PopoverTriggerState,
  PopoverPortalProps,
  PopoverBackdropProps,
  PopoverBackdropState,
  PopoverPositionerProps,
  PopoverPositionerState,
  PopoverPopupProps,
  PopoverPopupState,
  PopoverArrowProps,
  PopoverArrowState,
  PopoverViewportProps,
  PopoverViewportState,
  PopoverTitleState,
  PopoverDescriptionState,
  PopoverCloseState,
  PopoverPartsProps,
} from './components/Popover';

// Tooltip — полный Base UI 1.8 (Provider, Arrow, Viewport, Handle, тайминги)
export {
  TooltipParts,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
  TooltipViewport,
  createTooltipHandle,
} from './components/Tooltip';
export type {
  TooltipSide,
  TooltipAlign,
  TooltipHandle,
  TooltipProviderProps,
  TooltipRootProps,
  TooltipRootState,
  TooltipRootActions,
  TooltipRootChangeEventReason,
  TooltipRootChangeEventDetails,
  TooltipTriggerProps,
  TooltipTriggerState,
  TooltipPortalProps,
  TooltipPositionerProps,
  TooltipPositionerState,
  TooltipPopupProps,
  TooltipPopupState,
  TooltipArrowProps,
  TooltipArrowState,
  TooltipViewportProps,
  TooltipViewportState,
  TooltipProviderState,
} from './components/Tooltip';

// Menu — недостающие части 1.8 (Backdrop, Arrow, Viewport, Submenu, Handle)
export {
  MenuParts,
  MenuRoot,
  MenuTrigger,
  MenuPortal,
  MenuBackdrop,
  MenuPositioner,
  MenuPopup,
  MenuArrow,
  MenuViewport,
  MenuGroupLabel,
  MenuCheckboxItemIndicator,
  MenuRadioItemIndicator,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuSubmenu,
  createMenuHandle,
} from './components/Menu';
export type {
  MenuHandle,
  MenuRootProps,
  MenuRootState,
  MenuRootActions,
  MenuRootOrientation,
  MenuRootChangeEventReason,
  MenuRootChangeEventDetails,
  MenuTriggerProps,
  MenuTriggerState,
  MenuPortalProps,
  MenuBackdropProps,
  MenuPositionerProps,
  MenuPositionerState,
  MenuPopupProps,
  MenuPopupState,
  MenuArrowProps,
  MenuArrowState,
  MenuViewportProps,
  MenuItemState,
  MenuCheckboxItemState,
  MenuRadioGroupState,
  MenuRadioItemProps,
  MenuRadioItemState,
  MenuSeparatorProps,
  MenuGroupLabelProps,
  MenuCheckboxItemIndicatorProps,
  MenuRadioItemIndicatorProps,
  MenuSubmenuRootProps,
  MenuSubmenuTriggerProps,
  MenuSubmenuTriggerState,
  MenuSubmenuProps,
} from './components/Menu';

// Dialog / AlertDialog — полный Base UI 1.8 (Viewport, Close, Handle, modal)
export {
  DialogParts,
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogViewport,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
  createDialogHandle,
} from './components/Dialog';
export type {
  DialogHandle,
  DialogRootProps,
  DialogRootState,
  DialogRootActions,
  DialogRootChangeEventReason,
  DialogRootChangeEventDetails,
  DialogTriggerProps,
  DialogTriggerState,
  DialogBackdropState,
  DialogPopupState,
  DialogViewportState,
  DialogTitleState,
  DialogDescriptionState,
  DialogCloseProps,
  DialogCloseState,
} from './components/Dialog';

export {
  AlertDialogParts,
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogViewport,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
  createAlertDialogHandle,
} from './components/AlertDialog';
export type {
  AlertDialogHandle,
  AlertDialogRootProps,
  AlertDialogRootState,
  AlertDialogRootActions,
  AlertDialogRootChangeEventReason,
  AlertDialogRootChangeEventDetails,
  AlertDialogTriggerProps,
  AlertDialogTriggerState,
  AlertDialogCloseProps,
} from './components/AlertDialog';
// @seal:w5:end
// @seal:w6:start
export {
  FieldParts,
  FieldLabel,
  FieldControl,
  FieldItem,
  FieldDescription,
  FieldError,
  FieldValidity,
} from './components/Field';
export type {
  FieldRootProps,
  FieldLabelProps,
  FieldControlProps,
  FieldItemProps,
  FieldDescriptionProps,
  FieldErrorProps,
  FieldValidityProps,
} from './components/Field';
export type { CheckboxGroupParent } from './components/CheckboxGroup';
// @seal:w6:end
// @seal:w7:start
export type { TextAlign, TextWrap, TextTag, TextFormatter, HeadingTag } from './components/Text';
// @seal:w7:end
// @seal:w8:start
// Аудит W8: полные наборы частей Base UI 1.8 для Tabs / Progress /
// Accordion / Collapsible (плюс новые пропсы в Toggle, SegmentedControl,
// Toolbar, FilterPopover). Простой API остался как был.
export { TabsParts, TabsRoot, TabsList, TabsTab, TabsIndicator } from './components/Tabs';
export type { TabsOrientation, TabsRootProps, TabsListProps, TabsTabProps } from './components/Tabs';

export {
  ProgressParts,
  ProgressRoot,
  ProgressTrack,
  ProgressIndicator,
  ProgressValue,
  ProgressLabel,
} from './components/Progress';
export type {
  ProgressRootProps,
  ProgressTrackProps,
  ProgressIndicatorProps,
  ProgressValueProps,
  ProgressLabelProps,
} from './components/Progress';

export {
  AccordionParts,
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
} from './components/Accordion';
export type {
  AccordionRootProps,
  AccordionItemProps,
  AccordionHeaderProps,
  AccordionTriggerProps,
  AccordionPanelProps,
} from './components/Accordion';

export { CollapsibleParts, CollapsibleRoot, CollapsibleTrigger, CollapsiblePanel } from './components/Collapsible';
export type {
  CollapsibleRootProps,
  CollapsibleTriggerProps,
  CollapsiblePanelProps,
} from './components/Collapsible';

export type { SegmentedOrientation } from './components/SegmentedControl';
// @seal:w8:end

// ==== SEAL WAVE 4 — полировка (область на одного воркера) ====
// @seal:w9:start
export { Calendar, DateTimePicker, DateRangePicker } from './components/DateTimePicker';
export type { CalendarProps, DateTimePickerProps, DateRangePickerProps } from './components/DateTimePicker';
// @seal:w9:end
// @seal:w10:start
export type { ButtonGroupAlign } from './components/ButtonGroup';
// @seal:w10:end
// @seal:w11:start
export type { SegmentedChangeEventDetails } from './components/SegmentedControl';
export type { ToggleChangeEventDetails } from './components/Toggle';
// @seal:w11:end
// @seal:w12:start // @seal:w12:end
// @seal:w13:start
// W13: единый класс вида поля + новые типы Form (полный набор props Base UI).
export { INPUT_CLASS } from './components/Input';
export type { FormValues, FormActions, FormSubmitEventDetails } from './components/Form';
// @seal:w13:end
// @seal:w14:start // @seal:w14:end
// @seal:w15:start
// Select / Combobox / Autocomplete: публичный API не менялся — слайс
// сведён к одному набору классов панели пикеров и переиспользованию своих частей.
// @seal:w15:end
// @seal:w16:start // @seal:w16:end
// @seal:w17:start // @seal:w17:end
// @seal:w18:start // @seal:w18:end
// @seal:w19:start // @seal:w19:end
// @seal:w20:start
// W20 (Text/Heading/Avatar/Pill/Status/Separator/Stack): публичный API не менялся —
// новых экспортов не требуется, все правки в tokens.css и в реализации Avatar.
// @seal:w20:end
// @seal:w21:start // @seal:w21:end

// ==== SEAL WAVE 5 — области (каждая пара — одному воркеру) ====
// @seal:w22:start
export type {
  AutocompleteChangeEventDetails,
  AutocompleteRootState,
  AutocompleteRootActions,
  AutocompleteHighlightEventDetails,
} from './components/Autocomplete';
// @seal:w22:end
// @seal:w23:start // @seal:w23:end
// @seal:w24:start
// W24: Menubar + NavigationMenu. Новое в публичном API — только часть Backdrop
// (Base UI anatomy: Menu.Portal → Menu.Backdrop), которой у менюбара не было.
export { MenubarBackdrop } from './components/Menubar';
export type { MenubarBackdropProps } from './components/Menubar';
// @seal:w24:end
// @seal:w25:start
// Скептический проход Popover/Tooltip/PreviewCard: полные типы частей,
// которые раньше были закрыты inline-типом `{ children }`.
export type { PopoverTitleProps, PopoverDescriptionProps, PopoverCloseProps } from './components/Popover';
export type { PreviewCardRootChangeEventDetails } from './components/PreviewCard';
// @seal:w25:end
// @seal:w26:start // @seal:w26:end
// @seal:w27:start // @seal:w27:end
// @seal:w28:start // @seal:w28:end
// @seal:w29:start
// w29: Fieldset — недостающие части Base UI 1.8 (Root/Legend) и их пропсы.
// Field/Input/Form правок публичного API не требовали (только ref/nativeLabel/generic).
export { FieldsetParts, FieldsetRoot, FieldsetLegend } from './components/Fieldset';
export type { FieldsetRootProps, FieldsetLegendProps } from './components/Fieldset';
// @seal:w29:end
// @seal:w30:start // @seal:w30:end
// @seal:w31:start
// W31 (Slider): полный набор состояний/причин событий частей Base UI 1.8
// (сверено с node_modules/@base-ui/react/slider/*/*.d.ts — каждая часть
// объявляет `type State`; Root ещё и ChangeEventReason/Details + Commit*).
export type {
  SliderRootState,
  SliderRootChangeEventReason,
  SliderRootChangeEventDetails,
  SliderRootCommitEventReason,
  SliderRootCommitEventDetails,
  SliderLabelState,
  SliderValueState,
  SliderControlState,
  SliderTrackState,
  SliderIndicatorState,
  SliderThumbState,
} from './components/Slider';
// @seal:w31:end
// @seal:w32:start // @seal:w32:end
// @seal:w33:start
// W33-аудит (Tabs / Accordion / Collapsible): добор публичного API под Base UI 1.8 —
// полная часть Tabs.Panel, пропсы Indicator, второй аргумент onValueChange.
export { TabsPanelPart } from './components/Tabs';
export type { TabsChangeEventDetails, TabsPanelPartProps, TabsIndicatorProps } from './components/Tabs';
// @seal:w33:end

// @seal:w26-dialog:start
// Dialog/AlertDialog/Drawer: новые публичные части — Polar AlertDialogHeader/Footer
// и SheetHeader/Footer (область названа `w26-dialog`: имя `@seal:w26` занято слайсом
// Popover/Tooltip/PreviewCard — ID в волне совпал).
export { AlertDialogHeader, AlertDialogFooter } from './components/AlertDialog';
export type { AlertDialogHeaderProps, AlertDialogFooterProps } from './components/AlertDialog';
export { DrawerHeader, DrawerFooter } from './components/Drawer';
export type { DrawerHeaderProps, DrawerFooterProps } from './components/Drawer';
// @seal:w26-dialog:end
// @seal:w34:start
export type {
  SegmentedControlSingleProps,
  SegmentedControlMultipleProps,
} from './components/SegmentedControl';
// @seal:w34:end
// @seal:w35:start // @seal:w35:end
// @seal:w36:start // @seal:w36:end
// @seal:w37:start // @seal:w37:end
// @seal:w38:start // @seal:w38:end
// @seal:w39:start // @seal:w39:end
// @seal:w40:start // @seal:w40:end
// @seal:w41:start // @seal:w41:end
// @seal:w42:start // @seal:w42:end
// @seal:w43:start // @seal:w43:end
// @seal:w44:start // @seal:w44:end
// @seal:w45:start // @seal:w45:end
// @seal:w46:start
// Волна 46: порты orbit-компонентов, которых не хватало — Spinner,
// List/ListItem, ListGroup, Subnav, Truncated, Table (см. COMPONENTS.md).
export { Spinner } from './components/Spinner';
export type { SpinnerProps, SpinnerSize } from './components/Spinner';
export { List, ListItem } from './components/List';
export type { ListProps, ListItemProps, ListSize } from './components/List';
export { ListGroup, ListGroupItem } from './components/ListGroup';
export type { ListGroupProps, ListGroupItemProps } from './components/ListGroup';
export { Subnav, SubnavItem } from './components/Subnav';
export type { SubnavProps, SubnavItemProps } from './components/Subnav';
export { Truncated } from './components/Truncated';
export type { TruncatedProps } from './components/Truncated';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/Table';
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
} from './components/Table';
// @seal:w46:end
// @seal:w47:start
// Волна 47: DataTable на @tanstack/react-table v9 (порт orbit datatable/*,
// features API). manualPagination/manualSorting — состояние у потребителя.
export { DataTable } from './components/DataTable';
export type {
  DataTableProps,
  DataTablePaginationState,
  DataTableSortingState,
  ReactQueryLoading,
} from './components/DataTable';
export { DataTableColumnHeader } from './components/DataTableColumnHeader';
export type { DataTableColumnHeaderProps } from './components/DataTableColumnHeader';
export { DataTablePagination } from './components/DataTablePagination';
export type { DataTablePaginationProps } from './components/DataTablePagination';
export {
  createSelectionColumn,
  SELECTION_COLUMN_ID,
  SELECTION_COLUMN_WIDTH,
} from './components/DataTableSelectionColumn';
export type { DataTableSelection } from './components/DataTableSelectionColumn';
export { dataTableFeatures } from './components/dataTableFeatures';
export type {
  DataTableFeatures,
  DataTableCell,
  DataTableCellContext,
  DataTableColumn,
  DataTableColumnDef,
  DataTableInstance,
  DataTableRow,
} from './components/dataTableFeatures';
// @seal:w47:end
