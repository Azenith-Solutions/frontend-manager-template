import React, { Component, useEffect, useState } from "react";
import styles from "./Componentes.module.css";
import { api } from "../../service/api";
import ComponentFormModal from "../../components/forms/ComponentFormModal/ComponentFormModal";
import ComponentesDataGrid from "../../components/datagrids/ComponentesDataGrid/ComponentesDataGrid";
import ComponentDeleteModal from "../../components/forms/ComponentDeleteModal/ComponentDeleteModal";
import CatalogVisibilityModal from "../../components/forms/CatalogVisibilityModal/CatalogVisibilityModal";

// Componentes genéricos para header e filtro
import DatagridHeader from "../../components/headerDataGrids/DatagridHeader";
import ComponentesFilter from "../../components/menuFilter/ComponentesFilter";

// Material UI Components
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  Avatar,
  Divider,
  Card,
  CardContent
} from "@mui/material";

// Material UI Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';

const Componentes = () => {
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [totalComponents, setTotalComponents] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [componentToToggleVisibility, setComponentToToggleVisibility] = useState(null);
  const [newVisibilityValue, setNewVisibilityValue] = useState(false);
  const [toggleVisibilityLoading, setToggleVisibilityLoading] = useState(false);
  
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [availableCaixas, setAvailableCaixas] = useState([]);

  const [activeFilters, setActiveFilters] = useState({
    caixas: [],
    mercadoLivre: null,
    verificado: null, 
    condicao: [] 
  });

  // Imagem padrão para os componentes TESTE
  const defaultImage = "https://cdn.awsli.com.br/500x500/2599/2599375/produto/21644533946530777e3.jpg";

  useEffect(() => {
    document.title = "HardwareTech | Componentes";
    fetchComponents();
    fetchAvailableCaixas();
  }, []);

  // Função para buscar as caixas disponíveis para filtro
  const fetchAvailableCaixas = async () => {
    try {
      // Extrai as caixas únicas dos componentes
      const caixas = components
        .filter(comp => comp.fkCaixa?.nomeCaixa)
        .map(comp => comp.fkCaixa.nomeCaixa);
      
      // Remove duplicatas
      const uniqueCaixas = [...new Set(caixas)];
      setAvailableCaixas(uniqueCaixas);
    } catch (error) {
      console.error('Erro ao buscar caixas:', error);
      setAvailableCaixas([]);
    }
  };

  // Funções para gerenciar os filtros
  const handleOpenFilterMenu = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setFilterMenuAnchor(null);
  };

  const toggleCaixaFilter = (caixa) => {
    setActiveFilters(prev => {
      const newCaixas = prev.caixas.includes(caixa)
        ? prev.caixas.filter(item => item !== caixa)
        : [...prev.caixas, caixa];

      return { ...prev, caixas: newCaixas };
    });
    setPage(0); // Reset page when filter changes
  };

  const toggleMercadoLivreFilter = (value) => {
    setActiveFilters(prev => ({
      ...prev,
      mercadoLivre: prev.mercadoLivre === value ? null : value
    }));
    setPage(0); // Reset page when filter changes
  };

  const toggleVerificadoFilter = (value) => {
    setActiveFilters(prev => ({
      ...prev,
      verificado: prev.verificado === value ? null : value,
      // Limpar os filtros de condição se verificado for falso
      condicao: value === false ? [] : prev.condicao
    }));
    setPage(0); // Reset page when filter changes
  };

  const toggleCondicaoFilter = (condicao) => {
    setActiveFilters(prev => {
      const newCondicao = prev.condicao.includes(condicao)
        ? prev.condicao.filter(item => item !== condicao)
        : [...prev.condicao, condicao];

      return { ...prev, condicao: newCondicao };
    });
    setPage(0); // Reset page when filter changes
  };

  const clearAllFilters = () => {
    setActiveFilters({
      caixas: [],
      mercadoLivre: null,
      verificado: null,
      condicao: []
    });
    setPage(0); // Reset page when filters are cleared
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await api.get('/components');
      console.log('Resposta dos componentes:', response);

      const responseData = response.data.data || response.data;

      if (Array.isArray(responseData)) {
        setComponents(responseData);
        setTotalComponents(responseData.length);
      } else {
        console.error('Dados recebidos não são um array:', responseData);
        setComponents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setPage(0);
  };

  // Atualiza o fetchAvailableCaixas quando os componentes são carregados
  useEffect(() => {
    fetchAvailableCaixas();
  }, [components]);

  // Função para filtrar componentes com base em filtros e texto de busca
  const filteredComponents = components.filter(
    (item) => {
      // Filtro de texto de busca
      const matchesSearch = 
        (item.partNumber && item.partNumber.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.descricao && item.descricao.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.idHardWareTech && item.idHardWareTech.toString().includes(searchText.toLowerCase())) ||
        (item.nomeComponente && item.nomeComponente.toLowerCase().includes(searchText.toLowerCase()));
      
      // Filtro por caixa
      const matchesCaixa = activeFilters.caixas.length === 0 || 
        (item.fkCaixa && activeFilters.caixas.includes(item.fkCaixa.nomeCaixa));
      
      // Filtro por mercado livre
      const matchesMercadoLivre = activeFilters.mercadoLivre === null || 
        item.flagML === activeFilters.mercadoLivre;
      
      // Filtro por verificado
      const matchesVerificado = activeFilters.verificado === null || 
        item.flagVerificado === activeFilters.verificado;
      
      // Filtro por condição (só se aplica se verificado for true)
      let matchesCondicao = true;
      if (item.flagVerificado && activeFilters.condicao.length > 0) {
        const condicaoFormatada = item.condicao ? item.condicao.toLowerCase() : '';
        
        // Verifica se a condição do item corresponde a algum dos filtros selecionados
        matchesCondicao = (
          (activeFilters.condicao.includes('Bom Estado') && 
            (condicaoFormatada === 'bom_estado' || condicaoFormatada === 'bomestado')) ||
          (activeFilters.condicao.includes('Observação') && 
            (condicaoFormatada === 'em_observacao' || condicaoFormatada === 'emobservacao' || 
             condicaoFormatada === 'observacao' || condicaoFormatada === 'observação'))
        );
      }
      
      return matchesSearch && matchesCaixa && matchesMercadoLivre && matchesVerificado && matchesCondicao;
    }
  );

  // Calculando a contagem de itens filtrados para mostrar o badge
  const filteredCount = components.length - filteredComponents.length;

  const handleEditComponent = (component) => {
    setComponentToEdit(component);
    setModalOpen(true);
  };

  const handleAddComponent = () => {
    setComponentToEdit(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    fetchComponents();
  };

  const handleDeleteComponent = (component) => {
    setComponentToDelete(component);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setComponentToDelete(null);
    fetchComponents();
  };

  // Função para lidar com o início do processo de toggle de visibilidade
  const handleToggleCatalog = (componentId, newVisibility) => {
    // Encontra o componente pelo ID
    const component = components.find(c => c.idComponente === componentId);
    if (component) {
      setComponentToToggleVisibility(component);
      setNewVisibilityValue(newVisibility);
      setVisibilityModalOpen(true);
    }
  };

  // Função para confirmar e realizar a alteração de visibilidade
  const handleConfirmVisibilityChange = async () => {
    if (!componentToToggleVisibility) return;
    
    try {
      setToggleVisibilityLoading(true);
      
      const componentId = componentToToggleVisibility.idComponente;
      
      await api.patch(`/components/${componentId}/visibility`, {
        isVisibleCatalog: newVisibilityValue
      });
      
      const updatedComponents = components.map(comp => {
        if (comp.idComponente === componentId) {
          return { ...comp, isVisibleCatalog: newVisibilityValue };
        }
        return comp;
      });
      
      setComponents(updatedComponents);
      setVisibilityModalOpen(false);
      setComponentToToggleVisibility(null);
      
      // Recarregar os dados do servidor
      fetchComponents();
      
    } catch (error) {
      console.error("Erro ao alterar visibilidade no catálogo:", error);
    } finally {
      setToggleVisibilityLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando dados dos componentes...
        </Typography>
      </Box>
    );
  }

  return (
    <div className={styles.componentes}>
      <Paper elevation={1} className={styles.toolbar} sx={{
        p: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        mb: 2,
      }}>
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          flex: '1 1 auto',
          minWidth: '0',
        }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', sm: '250px' },
              minWidth: { xs: '100%', sm: '250px' },
              maxWidth: '300px',
              height: '38px',
              backgroundColor: '#f0f2f5',
              borderRadius: '20px',
              px: 1.5,
              overflow: 'hidden',
              border: '1px solid transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#e9ecf0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              },
              '&:focus-within': {
                backgroundColor: '#fff',
                boxShadow: '0 0 0 2px rgba(97,19,26,0.1)',
                border: '1px solid #e0e0e0'
              }
            }}
          >
            <SearchIcon
              sx={{
                color: '#61131A',
                fontSize: 18,
                opacity: 0.7,
                mr: 1,
                transition: 'transform 0.2s ease',
                transform: 'rotate(-5deg)',
                '&:hover': {
                  transform: 'rotate(0deg) scale(1.1)'
                }
              }}
            />
            <input
              type="text"
              placeholder="Buscar componente..."
              value={searchText}
              onChange={handleSearchChange}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#333',
                width: '100%',
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0px',
                fontFamily: 'inherit'
              }}
            />
          </Box>
          <Box sx={{
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}>
            <Box
              onClick={handleOpenFilterMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#f0f2f5',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid transparent',
                position: 'relative',
                '&:hover': {
                  backgroundColor: '#e2e6eb',
                  transform: 'scale(1.02)',
                }
              }}
            >
              <FilterListIcon
                fontSize="small"
                sx={{
                  color: '#61131A',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(180deg)'
                  }
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#444',
                  userSelect: 'none'
                }}
              >
                Filtrar
              </Typography>
              {filteredCount > 0 && (
                <Chip
                  label={filteredCount}
                  size="small"
                  color="error"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    height: 18,
                    minWidth: 18,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#f0f2f5',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid transparent',
                '&:hover': {
                  backgroundColor: '#e2e6eb',
                  transform: 'scale(1.02)',
                }
              }}
            >
              <FileDownloadIcon
                fontSize="small"
                sx={{
                  color: '#2980b9',
                  transition: 'transform 0.2s ease',
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#444',
                  userSelect: 'none'
                }}
              >
                Exportar
              </Typography>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{
            height: 28,
            mx: 0.5,
            display: { xs: 'none', md: 'block' }
          }} />

          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            ml: { xs: 0, md: 0.5 },
            flexGrow: 1,
            justifyContent: { xs: 'flex-start', md: 'flex-start' },
          }}>
            <Card sx={{
              height: '38px',
              flex: '1 1 140px',
              maxWidth: '180px',
              minWidth: '140px',
              borderTop: '3px solid #61131A',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{
                p: '4px 8px',
                pb: '4px !important',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: '#ffeded',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1,
                    flexShrink: 0
                  }}>
                    <InventoryIcon sx={{ color: '#61131A', fontSize: 14 }} />
                  </Box>
                  <Box sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                  }}>
                    <Typography variant="h6" sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: 0,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {totalComponents}
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontSize: '0.6rem',
                      color: '#666',
                      fontWeight: 500,
                      lineHeight: 1,
                      mt: '0px',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Cadastrados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{
              height: '38px',
              flex: '1 1 170px',
              maxWidth: '200px',
              minWidth: '170px',
              borderTop: '3px solid #27ae60',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              overflow: 'visible',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{
                p: '4px 8px',
                pb: '4px !important',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: '#eaf7ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1,
                    flexShrink: 0
                  }}>
                    <StorefrontIcon sx={{ color: '#27ae60', fontSize: 14 }} />
                  </Box>
                  <Box sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                  }}>
                    <Typography variant="h6" sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      lineHeight: 1,
                      mb: 0,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {components.filter(item => item.flagML).length}
                    </Typography>
                    <Typography variant="caption" sx={{
                      fontSize: '0.6rem',
                      color: '#666',
                      fontWeight: 500,
                      lineHeight: 1,
                      mt: '0px',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Anunciados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
        <Button
          size="small"
          variant="contained"
          disableElevation
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddComponent}
          sx={{
            height: '38px',
            bgcolor: '#61131A',
            '&:hover': { bgcolor: '#4e0f15' },
            borderRadius: '4px',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            px: 1.5,
            minWidth: '100px',
            flexShrink: 0,
            ml: { xs: 0, sm: 'auto' },
            alignSelf: { xs: 'flex-start', sm: 'center' }
          }}
        >
          Adicionar componente
        </Button>
      </Paper>

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: 0,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Substituindo a tabela pelo componente ComponentesDataGrid */}
        <ComponentesDataGrid 
          components={components}
          filteredComponents={filteredComponents}
          page={page}
          rowsPerPage={rowsPerPage}
          defaultImage={defaultImage}
          onEditComponent={handleEditComponent}
          onDeleteComponent={handleDeleteComponent}
          onToggleCatalog={handleToggleCatalog}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Container>

      {/* Modal do formulário de componente */}
      <ComponentFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        componentToEdit={componentToEdit}
        componentes={components}
      />

      {/* Modal de deleção de componente */}
      <ComponentDeleteModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        component={componentToDelete}
        onComponentDeleted={handleCloseDeleteModal}
      />

      {/* Modal de visibilidade do catálogo */}
      <CatalogVisibilityModal
        open={visibilityModalOpen}
        onClose={() => setVisibilityModalOpen(false)}
        component={componentToToggleVisibility}
        newVisibility={newVisibilityValue}
        onConfirm={handleConfirmVisibilityChange}
        isLoading={toggleVisibilityLoading}
      />

      {/* Menu de filtros */}
      <ComponentesFilter
        anchorEl={filterMenuAnchor}
        onClose={handleCloseFilterMenu}
        availableCaixas={availableCaixas}
        activeFilters={activeFilters}
        toggleCaixaFilter={toggleCaixaFilter}
        toggleMercadoLivreFilter={toggleMercadoLivreFilter}
        toggleVerificadoFilter={toggleVerificadoFilter}
        toggleCondicaoFilter={toggleCondicaoFilter}
        clearAllFilters={clearAllFilters}
      />
    </div>
  );
};

export default Componentes;